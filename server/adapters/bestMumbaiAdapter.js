const BaseAdapter = require('./baseAdapter');

class BestMumbaiAdapter extends BaseAdapter {
  constructor() {
    super({
      agencyId: 'best_mumbai',
      agencyName: 'Brihanmumbai Electric Supply & Transport (BEST) & Maha Mumbai Metro',
      sourceUrl: 'https://www.bestundertaking.com'
    });
  }

  async fetchNotices() {
    const now = new Date();
    const isoNow = now.toISOString();
    const in4Days = new Date(now.getTime() + 4 * 86400000).toISOString();
    const in12Days = new Date(now.getTime() + 12 * 86400000).toISOString();
    const yesterday = new Date(now.getTime() - 86400000).toISOString();

    return [
      {
        id: 'BEST-DIV-2026-108',
        title: 'Coastal Road Linkage: BEST Routes 108, 123 & 132 Diverted via Maharshi Karve Road',
        summary: 'Due to municipal asphalt resurfacing and gantry installation on Marine Drive (Netaji Subhash Chandra Bose Road) between Nariman Point and Churchgate, south-bound buses will divert via Maharshi Karve Road. Expect 10-15 min delays.',
        notice_type: 'diversion',
        route_id: 'BEST-108',
        state: 'Maharashtra',
        district: 'Mumbai City',
        transport_type: 'bus',
        affected_area: 'Marine Drive, Nariman Point, Churchgate Station',
        source_url: 'https://www.bestundertaking.com/notices/marine-drive-diversion',
        published_time: yesterday,
        valid_from: yesterday,
        valid_to: in12Days,
        geojson: {
          type: 'LineString',
          coordinates: [[72.8258, 18.9322], [72.8282, 18.9370], [72.8315, 18.9410]]
        }
      },
      {
        id: 'MMMOCL-METRO3-2026-05',
        title: 'Mumbai Metro Line 3 (Aqua Line): BKC Station Entry Gate 2 Modification',
        summary: 'Underground pedestrian walkway integration at Bandra Kurla Complex (BKC) station. Entry Gate 2 temporarily closed. Commuters are advised to utilize Gate 1 (near Diamond Bourse) and Gate 3 (near MCA).',
        notice_type: 'advisory',
        route_id: 'METRO-LINE3',
        state: 'Maharashtra',
        district: 'Mumbai Suburban',
        transport_type: 'metro',
        affected_area: 'Bandra Kurla Complex (BKC), Kalanagar, Bandra East',
        source_url: 'https://www.mmrcl.com/travel-updates/bkc-entry',
        published_time: isoNow,
        valid_from: isoNow,
        valid_to: in4Days
      },
      {
        id: 'BEST-ALERT-2026-44',
        title: 'Andheri-Ghatkopar Link Road: Pothole Rectification Bus Speed Caution',
        summary: 'MMRDA road restoration on AG Link Road between Sakinaka junction and Asalpha. Buses running with restricted speed of 25 km/h.',
        notice_type: 'delay',
        route_id: 'BEST-340',
        state: 'Maharashtra',
        district: 'Mumbai Suburban',
        transport_type: 'bus',
        affected_area: 'Sakinaka, Asalpha, Andheri East, Ghatkopar West',
        source_url: 'https://www.bestundertaking.com/traffic-updates',
        published_time: yesterday,
        valid_from: yesterday,
        valid_to: in4Days
      }
    ];
  }

  async fetchVehicles() {
    return [
      {
        id: 'MH-01-AP-6611',
        agency_id: 'best_mumbai',
        route_id: 'BEST-108',
        vehicle_label: 'BEST Olectra Double-Decker #6611',
        lat: 18.9322,
        lng: 72.8258, // Churchgate
        bearing: 15,
        speed_kmh: 18,
        status: 'delayed',
        last_updated_at: new Date().toISOString()
      },
      {
        id: 'MH-02-CW-4105',
        agency_id: 'best_mumbai',
        route_id: 'BEST-340',
        vehicle_label: 'BEST CNG Mini #4105',
        lat: 19.0988,
        lng: 72.8872, // Sakinaka
        bearing: 110,
        speed_kmh: 22,
        status: 'normal',
        last_updated_at: new Date().toISOString()
      }
    ];
  }
}

module.exports = BestMumbaiAdapter;
