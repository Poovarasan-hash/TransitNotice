import uuid
import datetime
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import User, UserPreference
from backend.app.schemas import UserCreate, UserLogin, Token, UserOut, UserPreferencesUpdate, UserPreferencesOut

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    existing = db.query(User).filter((User.username == user_in.username.strip()) | (User.email == user_in.email.strip().lower())).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email or username already exists")

    now = datetime.datetime.utcnow()
    user_id = str(uuid.uuid4())
    pw_hash = get_password_hash(user_in.password)

    new_user = User(
        id=user_id,
        username=user_in.username.strip(),
        email=user_in.email.strip().lower(),
        password_hash=pw_hash,
        role="commuter",
        created_at=now
    )
    db.add(new_user)

    # Initial preferences
    pref = UserPreference(
        id=str(uuid.uuid4()),
        user_id=user_id,
        state="Delhi (NCT)",
        district="South Delhi",
        route_id="DTC-534",
        agency_id="delhi_otd",
        alert_types=["diversion", "delay", "cancellation"],
        created_at=now
    )
    db.add(pref)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "username": new_user.username, "role": new_user.role})

    return {
        "message": "Account created successfully",
        "user": new_user,
        "token": token
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    ident = login_in.emailOrUsername.strip().lower()
    user = db.query(User).filter((User.email == ident) | (User.username == login_in.emailOrUsername.strip())).first()

    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/username or password")

    token = create_access_token({"sub": user.id, "username": user.username, "role": user.role})
    return {
        "message": "Logged in successfully",
        "user": user,
        "token": token
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "created_at": current_user.created_at
        },
        "preferences": pref
    }

@router.put("/preferences")
def update_preferences(pref_in: UserPreferencesUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            state=pref_in.state,
            district=pref_in.district,
            route_id=pref_in.route_id,
            agency_id=pref_in.agency_id,
            alert_types=pref_in.alert_types or ["diversion", "delay", "cancellation"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(pref)
    else:
        if pref_in.state is not None:
            pref.state = pref_in.state
        if pref_in.district is not None:
            pref.district = pref_in.district
        if pref_in.route_id is not None:
            pref.route_id = pref_in.route_id
        if pref_in.agency_id is not None:
            pref.agency_id = pref_in.agency_id
        if pref_in.alert_types is not None:
            pref.alert_types = pref_in.alert_types

    db.commit()
    return {"message": "Preferences updated successfully"}
