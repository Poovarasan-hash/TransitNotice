const BaseAdapter = require('./baseAdapter');

class NtesRailAdapter extends BaseAdapter {
  constructor() {
    super({
      agencyId: 'indian_railways',
      agencyName: 'Indian Railways / NTES & Suburban Commuter Rail',
      sourceUrl: 'https://enquiry.indianrail.gov.in'
    });
  }

  async fetchNotices() {
    const now = new Date();
    const isoNow = now.toISOString();
    const in2Days = new Date(now.getTime() + 2 * 86400000).toISOString();
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString();
    const yesterday = new Date(now.getTime() - 86400000).toISOString();

    return [
      {
        id: 'IR-CR-MEGABLOCK-2026-44',
        title: 'Central Railway: Sunday Mega Block Between Matunga and Mulund (Slow Corridor)',
        summary: 'To carry out engineering and maintenance works on UP and DOWN slow lines between Matunga and Mulund stations from 11:05 AM to 03:55 PM. All slow local trains will be diverted on fast corridors between Vidyavihar and Mulund with halts at Ghatkopar, Vikhroli, Bhandup and Mulund.',
        notice_type: 'interruption',
        route_id: 'IR-CR-MAIN',
        state: 'Maharashtra',
        district: 'Mumbai Suburban',
        transport_type: 'rail',
        affected_area: 'CSMT, Dadar, Matunga, Kurla, Ghatkopar, Thane, Kalyan',
        source_url: 'https://cr.indianrailways.gov.in/press_releases/mega-block',
        published_time: yesterday,
        valid_from: yesterday,
        valid_to: in2Days,
        geojson: {
          type: 'LineString',
          coordinates: [[72.8550, 19.0270], [72.8710, 19.0650], [72.9380, 19.1720]]
        }
      },
      {
        id: 'IR-SR-BLOCK-2026-12',
        title: 'Southern Railway: Power Block Between Chennai Beach and Tambaram',
        summary: 'Maintenance of overhead traction equipment between St. Thomas Mount and Pallavaram. Suburban electric services will operate with 20-minute interval between 10:30 AM and 01:30 PM on Saturday.',
        notice_type: 'delay',
        route_id: 'IR-SR-TAMBARAM',
        state: 'Tamil Nadu',
        district: 'Chennai',
        transport_type: 'rail',
        affected_area: 'Chennai Beach, Guindy, St. Thomas Mount, Tambaram',
        source_url: 'https://sr.indianrailways.gov.in/suburban-updates',
        published_time: isoNow,
        valid_from: isoNow,
        valid_to: in7Days
      }
    ];
  }

  async fetchVehicles() {
    return [];
  }
}

module.exports = NtesRailAdapter;
