import httpx
import asyncio
from typing import List, Dict, Any
from backend.app.config import settings

class BaseAdapter:
    def __init__(self, agency_id: str, agency_name: str, source_url: str):
        self.agency_id = agency_id
        self.agency_name = agency_name
        self.source_url = source_url
        self.timeout = settings.FETCH_TIMEOUT_SECONDS
        self.max_retries = settings.MAX_RETRIES

    async def fetch_with_retry(self, url: str, headers: dict = None) -> Any:
        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, headers=headers)
                    resp.raise_for_status()
                    return resp.json()
            except Exception as e:
                last_error = e
                if attempt < self.max_retries:
                    backoff = 0.5 * (2 ** (attempt - 1))
                    await asyncio.sleep(backoff)
        raise last_error

    async def fetch_notices(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        return []
