const BaseAdapter = require('./baseAdapter');

class MtcChennaiAdapter extends BaseAdapter {
  constructor() {
    super({
      agencyId: 'mtc_chennai',
      agencyName: 'Metropolitan Transport Corporation (MTC Chennai) & CMRL',
      sourceUrl: 'https://mtcbus.tn.gov.in'
    });
  }

  async fetchNotices() {
    const now = new Date();
    const isoNow = now.toISOString();
    const in6Days = new Date(now.getTime() + 6 * 86400000).toISOString();
    const in15Days = new Date(now.getTime() + 15 * 86400000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();

    return [
      {
        id: 'MTC-ADV-2026-041',
        title: 'Phase-2 CMRL Corridor 4 Work: Mount-Poonamallee Road Route Diversions',
        summary: 'Due to elevated metro pier construction on Mount-Poonamallee High Road near Porur junction, MTC Deluxe bus routes 25G, 49, 88M and 54 are diverted via Ramapuram DLF IT Park and Butt Road. All scheduled stops between Mugalivakkam and Porur will be served via parallel service lane.',
        notice_type: 'diversion',
        route_id: 'MTC-25G',
        state: 'Tamil Nadu',
        district: 'Chennai',
        transport_type: 'bus',
        affected_area: 'Porur Junction, Ramapuram, Mount-Poonamallee Road, Guindy',
        source_url: 'https://mtcbus.tn.gov.in/notices/porur-cmrl-diversion',
        published_time: threeDaysAgo,
        valid_from: threeDaysAgo,
        valid_to: in15Days,
        geojson: {
          type: 'LineString',
          coordinates: [[80.1582, 13.0336], [80.1741, 13.0298], [80.2014, 13.0102]]
        }
      },
      {
        id: 'CMRL-METRO-2026-19',
        title: 'CMRL Blue Line: Special Late Night Services Extended for Chennai Central Connection',
        summary: 'To facilitate passengers arriving on late-night long distance trains at Dr MGR Chennai Central, CMRL extends last train departure from Chennai Central to Chennai Airport until 23:45 hrs on Fridays and Sundays.',
        notice_type: 'advisory',
        route_id: 'CMRL-BLUE',
        state: 'Tamil Nadu',
        district: 'Chennai',
        transport_type: 'metro',
        affected_area: 'Chennai Central, Government Estate, Guindy, Airport',
        source_url: 'https://chennaimetrorail.org/travel-updates',
        published_time: isoNow,
        valid_from: isoNow,
        valid_to: in6Days
      },
      {
        id: 'MTC-OMR-2026-88',
        title: 'OMR IT Expressway Bus Lane: Temporary Interruption Near Tidel Park Flyover',
        summary: 'Highways department stormwater drain interlinking near SRP Tools and Tidel Park junction. Northbound dedicated bus lane will merge with general traffic for 300 meters.',
        notice_type: 'interruption',
        route_id: 'MTC-570',
        state: 'Tamil Nadu',
        district: 'Chennai',
        transport_type: 'bus',
        affected_area: 'Old Mahabalipuram Road (OMR), Tidel Park, SRP Tools, Thiruvanmiyur',
        source_url: 'https://mtcbus.tn.gov.in/omr-updates',
        published_time: isoNow,
        valid_from: isoNow,
        valid_to: in6Days
      }
    ];
  }

  async fetchVehicles() {
    return [
      {
        id: 'TN-01-AN-1984',
        agency_id: 'mtc_chennai',
        route_id: 'MTC-25G',
        vehicle_label: 'MTC Low-Floor AC #1984',
        lat: 13.0298,
        lng: 80.1741, // Porur / Ramapuram
        bearing: 105,
        speed_kmh: 22,
        status: 'delayed',
        last_updated_at: new Date().toISOString()
      },
      {
        id: 'TN-01-AN-4509',
        agency_id: 'mtc_chennai',
        route_id: 'MTC-570',
        vehicle_label: 'MTC Express #4509',
        lat: 12.9862,
        lng: 80.2458, // Tidel Park OMR
        bearing: 185,
        speed_kmh: 30,
        status: 'normal',
        last_updated_at: new Date().toISOString()
      }
    ];
  }
}

module.exports = MtcChennaiAdapter;
