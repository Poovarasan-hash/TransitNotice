/**
 * India National Transit Coverage Registry
 * Catalogues transit data verification status across Indian States and Districts.
 * Strictly distinguishes live RT feeds, official advisory feeds, schedule only, and unintegrated regions.
 */

const COVERAGE_LEVELS = {
  LIVE_RT: 'live_rt',                 // Live GTFS-RT / Vehicle Tracking / GPS
  ADVISORY_VERIFIED: 'advisory_verified', // Official circulars, diversions, portal notices
  SCHEDULE_ONLY: 'schedule_only',         // Timetables and planned stops only, no live feeds
  UNINTEGRATED: 'unintegrated'           // No open API/feed verified yet
};

const STATES_AND_DISTRICTS = [
  {
    state: 'Delhi (NCT)',
    districts: [
      { name: 'Central Delhi', level: COVERAGE_LEVELS.LIVE_RT, modes: ['bus', 'metro'], agency: 'Delhi Transport Corp (DTC) & DMRC', notes: 'Open Transit Data (OTD) portal live GTFS & static feeds' },
      { name: 'New Delhi', level: COVERAGE_LEVELS.LIVE_RT, modes: ['bus', 'metro'], agency: 'DTC, Cluster, DMRC', notes: 'Verified real-time route alerts and diversions' },
      { name: 'South Delhi', level: COVERAGE_LEVELS.LIVE_RT, modes: ['bus', 'metro'], agency: 'DTC & DMRC', notes: 'Live GPS bus positions & metro advisory notifications' },
      { name: 'North Delhi', level: COVERAGE_LEVELS.LIVE_RT, modes: ['bus', 'metro'], agency: 'DTC & DMRC', notes: 'GTFS-RT alerts verified' },
      { name: 'West Delhi', level: COVERAGE_LEVELS.LIVE_RT, modes: ['bus', 'metro'], agency: 'DTC & DMRC', notes: 'Active route alerts and track maintenance' },
      { name: 'East Delhi', level: COVERAGE_LEVELS.LIVE_RT, modes: ['bus', 'metro'], agency: 'DTC & DMRC', notes: 'Trans-Yamuna corridor updates' }
    ]
  },
  {
    state: 'Karnataka',
    districts: [
      { name: 'Bengaluru Urban', level: COVERAGE_LEVELS.LIVE_RT, modes: ['bus', 'metro'], agency: 'BMTC & BMRCL Namma Metro', notes: 'BMTC Intelligent Transport System API & Namma Metro Yellow/Purple line advisories' },
      { name: 'Mysuru', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'KSRTC Mysore Urban', notes: 'Schedule/advisory data only. Live GPS feed restricted to internal depot dispatch.' },
      { name: 'Dakshina Kannada (Mangaluru)', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'KSRTC Mangalore', notes: 'Intercity schedule and coastal road monsoon advisories' },
      { name: 'Dharwad (Hubballi-Dharwad)', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'NWKRTC & HDBRTS', notes: 'BRTS corridor schedule only' }
    ]
  },
  {
    state: 'Maharashtra',
    districts: [
      { name: 'Mumbai Suburban', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro', 'rail'], agency: 'BEST, Maha Mumbai Metro & Central/Western Railway', notes: 'Daily mega-block updates, Metro Line 2A/7 & Aqua Line 3 diversions' },
      { name: 'Mumbai City', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro', 'rail'], agency: 'BEST & CMRL', notes: 'South Mumbai coastal road & arterial diversions' },
      { name: 'Pune', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro'], agency: 'PMPML & Pune Metro', notes: 'Civil Court interchange & Swargate underground extension updates' },
      { name: 'Thane', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'rail'], agency: 'TMT & Central Railway', notes: 'Ghopdeo bridge & suburban block notifications' },
      { name: 'Nagpur', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus', 'metro'], agency: 'Maha Metro Nagpur & NMC', notes: 'Schedule/advisory data only.' }
    ]
  },
  {
    state: 'Tamil Nadu',
    districts: [
      { name: 'Chennai', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro', 'rail'], agency: 'MTC Chennai, CMRL & Southern Railway', notes: 'Phase 2 Metro construction diversions at Kodambakkam, Porur & OMR' },
      { name: 'Coimbatore', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'TNSTC Coimbatore', notes: 'Schedule data only. Live tracking pending smart city API integration.' },
      { name: 'Madurai', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'TNSTC Madurai', notes: 'Temple corridor festival diversions' },
      { name: 'Kanchipuram', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'TNSTC & Suburban Rail', notes: 'Industrial corridor schedules' }
    ]
  },
  {
    state: 'Kerala',
    districts: [
      { name: 'Ernakulam (Kochi)', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro', 'ferry'], agency: 'KMRL Metro, Kochi Water Metro & KSRTC SWIFT', notes: 'Water Metro jetty updates & Vyttila mobility hub diversions' },
      { name: 'Thiruvananthapuram', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus'], agency: 'KSRTC City Circular Electric', notes: 'Electric bus circular route advisories' },
      { name: 'Wayanad', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus'], agency: 'KSRTC North Zone', notes: 'Thamarassery Churam ghat road weather diversions and weight limits' },
      { name: 'Kozhikode', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'KSRTC Kozhikode', notes: 'Schedule/advisory only' }
    ]
  },
  {
    state: 'Telangana',
    districts: [
      { name: 'Hyderabad', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro'], agency: 'TSRTC & Hyderabad Metro Rail (L&T)', notes: 'Ameerpet interchange, MGBS hub and airport express updates' },
      { name: 'Rangareddy', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro'], agency: 'TSRTC Cyberabad', notes: 'Hitec City IT corridor shuttle and flyover construction diversions' }
    ]
  },
  {
    state: 'West Bengal',
    districts: [
      { name: 'Kolkata', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro', 'ferry', 'rail'], agency: 'WBTC, KMRCL Metro & Eastern Railway', notes: 'Underwater East-West Green line, Howrah tram route alterations' },
      { name: 'North 24 Parganas', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus', 'rail'], agency: 'WBTC & Eastern Railway', notes: 'Airport corridor & Sealdah north suburban block updates' }
    ]
  },
  {
    state: 'Gujarat',
    districts: [
      { name: 'Ahmedabad', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro'], agency: 'AMTS, Janmarg BRTS & Gujarat Metro (GMRC)', notes: 'Sabarmati riverfront & Gandhinagar connectivity alerts' },
      { name: 'Surat', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'Sitilink BRTS', notes: 'Schedule/advisory only' }
    ]
  },
  {
    state: 'Rajasthan',
    districts: [
      { name: 'Jaipur', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro'], agency: 'JCTSL & Jaipur Metro Rail Corp (JMRC)', notes: 'Badi Chaupar heritage corridor metro & bus updates' }
    ]
  },
  {
    state: 'Uttar Pradesh',
    districts: [
      { name: 'Lucknow', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro'], agency: 'UPMRC (Lucknow Metro) & UPSRTC', notes: 'Airport-Charbagh corridor alerts' },
      { name: 'Gautam Buddha Nagar (Noida)', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro'], agency: 'NMRC Aqua Line & DTC Inter-state', notes: 'Aqua Line & Pari Chowk route updates' },
      { name: 'Kanpur', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus', 'metro'], agency: 'UPMRC Kanpur Metro', notes: 'IIT-Motijheel priority corridor schedules' }
    ]
  },
  {
    state: 'Punjab',
    districts: [
      { name: 'Amritsar', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'Amritsar BRTS', notes: 'Golden Temple corridor schedule updates' },
      { name: 'Ludhiana', level: COVERAGE_LEVELS.UNINTEGRATED, modes: ['bus'], agency: 'PRTC', notes: 'Live data unavailable. Schedule data pending agency open API release.' }
    ]
  },
  {
    state: 'Haryana',
    districts: [
      { name: 'Gurugram', level: COVERAGE_LEVELS.ADVISORY_VERIFIED, modes: ['bus', 'metro'], agency: 'Gurugram Metropolitan City Bus (GMCBL Gurugaman) & Rapid Metro', notes: 'Millennium City Centre & Cyber Hub connectivity notices' },
      { name: 'Faridabad', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus', 'metro'], agency: 'Haryana Roadways & DMRC Violet Line', notes: 'Schedule/advisory data only.' }
    ]
  },
  {
    state: 'Andhra Pradesh',
    districts: [
      { name: 'Visakhapatnam', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'APSRTC Vizag', notes: 'Beach road & Simhachalam festival advisories' },
      { name: 'Vijayawada', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'APSRTC Krishna', notes: 'Pandit Nehru Bus Station corridor updates' }
    ]
  },
  {
    state: 'Madhya Pradesh',
    districts: [
      { name: 'Bhopal', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'BCLL MyBus & MP Metro', notes: 'BRTS corridor dismantling & metro construction updates' },
      { name: 'Indore', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'AiCTSL iBus', notes: 'AB Road BRTS schedule updates' }
    ]
  },
  {
    state: 'Odisha',
    districts: [
      { name: 'Khordha (Bhubaneswar)', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'CRUT Mo Bus', notes: 'Mo Bus transit advisories and Puri corridor updates' }
    ]
  },
  {
    state: 'Bihar',
    districts: [
      { name: 'Patna', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'BSRTC', notes: 'Patna Metro construction diversions at Bailey Road' }
    ]
  },
  {
    state: 'Assam',
    districts: [
      { name: 'Kamrup Metropolitan (Guwahati)', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus', 'ferry'], agency: 'ASTC & Inland Water Transport', notes: 'Brahmaputra passenger ferry monsoon schedules' }
    ]
  },
  {
    state: 'Jammu & Kashmir',
    districts: [
      { name: 'Srinagar', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'Smart City Electric Bus & JKSRTC', notes: 'Dal Lake & airport circular electric bus updates' },
      { name: 'Jammu', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'Jammu Smart City e-Bus', notes: 'Schedule data only' }
    ]
  },
  {
    state: 'Goa',
    districts: [
      { name: 'North Goa', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus', 'ferry'], agency: 'Kadamba Transport Corp (KTCL)', notes: 'Mandovi & Zuari river ferry updates, airport EV shuttle' },
      { name: 'South Goa', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'KTCL Margao', notes: 'Schedule/advisory data only' }
    ]
  },
  {
    state: 'Himachal Pradesh',
    districts: [
      { name: 'Shimla', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus', 'rail'], agency: 'HRTC & Kalka-Shimla Toy Train', notes: 'Mountain weather, snowfall road blocks, and HRTC hill station notices' }
    ]
  },
  {
    state: 'Uttarakhand',
    districts: [
      { name: 'Dehradun', level: COVERAGE_LEVELS.SCHEDULE_ONLY, modes: ['bus'], agency: 'UTC Dehradun & Mussoorie', notes: 'Hill route monsoon advisories' }
    ]
  },
  {
    state: 'Other Indian States (Default Catalog)',
    districts: [
      { name: 'All Unlisted Districts', level: COVERAGE_LEVELS.UNINTEGRATED, modes: ['bus', 'rail'], agency: 'State RTC & Indian Railways', notes: 'Live data unavailable. Open transit API currently unintegrated for this district. Schedule/national advisories only.' }
    ]
  }
];

function getCoverageForDistrict(state, district) {
  const normState = (state || '').toLowerCase();
  const normDistrict = (district || '').toLowerCase();

  for (const st of STATES_AND_DISTRICTS) {
    if (st.state.toLowerCase().includes(normState) || normState.includes(st.state.toLowerCase())) {
      const match = st.districts.find(d => 
        d.name.toLowerCase().includes(normDistrict) || normDistrict.includes(d.name.toLowerCase())
      );
      if (match) {
        return {
          state: st.state,
          district: match.name,
          coverage_level: match.level,
          modes: match.modes,
          agency: match.agency,
          notes: match.notes,
          is_live_available: match.level === COVERAGE_LEVELS.LIVE_RT,
          provenance: match.level === COVERAGE_LEVELS.LIVE_RT ? 'Official Live Feed' : 'Official Portal / Circulars'
        };
      }
    }
  }

  return {
    state: state || 'India',
    district: district || 'Unspecified',
    coverage_level: COVERAGE_LEVELS.UNINTEGRATED,
    modes: ['bus', 'rail'],
    agency: 'State Transport / Regional Authority',
    notes: 'Live data unavailable. Schedule/advisory data only. No direct real-time API connected for this specific district yet.',
    is_live_available: false,
    provenance: 'Unintegrated Area'
  };
}

module.exports = {
  COVERAGE_LEVELS,
  STATES_AND_DISTRICTS,
  getCoverageForDistrict
};
