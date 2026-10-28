const BaseAdapter = require('./baseAdapter');

class KsrtcAdapter extends BaseAdapter {
  constructor() {
    super({
      agencyId: 'ksrtc_kerala',
      agencyName: 'Kerala State Road Transport Corp (KSRTC SWIFT) & Kochi Metro (KMRL)',
      sourceUrl: 'https://www.onlineksrtcswift.com'
    });
  }

  async fetchNotices() {
    const now = new Date();
    const isoNow = now.toISOString();
    const in8Days = new Date(now.getTime() + 8 * 86400000).toISOString();
    const in14Days = new Date(now.getTime() + 14 * 86400000).toISOString();
    const yesterday = new Date(now.getTime() - 86400000).toISOString();

    return [
      {
        id: 'KSRTC-GHAT-2026-14',
        title: 'Thamarassery Churam (NH 766): Heavy Multi-Axle Bus Restriction & Diversion via Kuttiyadi',
        summary: 'Following district collectorate advisory regarding heavy rainfall and slope stabilization works at hairpin bends 7 and 8 of Thamarassery ghat road, multi-axle Super Deluxe and Gajaraj buses from Kozhikode to Wayanad/Bengaluru are diverted via Kuttiyadi ghat route.',
        notice_type: 'diversion',
        route_id: 'KSRTC-WAYANAD',
        state: 'Kerala',
        district: 'Wayanad',
        transport_type: 'bus',
        affected_area: 'Thamarassery Churam, Adivaram, Lakkidi, Kalpetta, Kuttiyadi',
        source_url: 'https://www.keralartc.com/travel-alerts/ghat-diversion',
        published_time: yesterday,
        valid_from: yesterday,
        valid_to: in14Days,
        geojson: {
          type: 'LineString',
          coordinates: [[75.9821, 11.4889], [76.0145, 11.5120], [76.0825, 11.5540]]
        }
      },
      {
        id: 'KMRL-WATER-2026-03',
        title: 'Kochi Water Metro: High Tide Service Adjustments at Fort Kochi & Vypeen Terminals',
        summary: 'Due to astronomical spring tide forecast in Vembanad Lake estuary, electric hybrid boat boarding at Fort Kochi jetty will use pontoon floating ramp #2 with 5-minute headway modifications.',
        notice_type: 'advisory',
        route_id: 'KMRL-WATER-1',
        state: 'Kerala',
        district: 'Ernakulam (Kochi)',
        transport_type: 'ferry',
        affected_area: 'High Court Jetty, Vypeen, Fort Kochi Water Metro Terminal',
        source_url: 'https://kochimetro.org/water-metro-services',
        published_time: isoNow,
        valid_from: isoNow,
        valid_to: in8Days
      }
    ];
  }

  async fetchVehicles() {
    return [
      {
        id: 'KL-15-A-8711',
        agency_id: 'ksrtc_kerala',
        route_id: 'KSRTC-WAYANAD',
        vehicle_label: 'KSRTC-SWIFT Super Fast #8711',
        lat: 11.5540,
        lng: 76.0825, // Kalpetta Wayanad
        bearing: 40,
        speed_kmh: 38,
        status: 'delayed',
        last_updated_at: new Date().toISOString()
      },
      {
        id: 'WM-BOAT-06',
        agency_id: 'ksrtc_kerala',
        route_id: 'KMRL-WATER-1',
        vehicle_label: 'Kochi Water Metro Boat #06',
        lat: 9.9678,
        lng: 76.2428, // Fort Kochi
        bearing: 310,
        speed_kmh: 15,
        status: 'normal',
        last_updated_at: new Date().toISOString()
      }
    ];
  }
}

module.exports = KsrtcAdapter;
