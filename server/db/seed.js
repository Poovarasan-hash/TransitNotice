const bcrypt = require('bcryptjs');
const { getDb } = require('./database');
const { STATES_AND_DISTRICTS } = require('../services/coverageRegistry');

function seedDatabase(db = getDb()) {
  console.log('[Seed] Seeding TransitNotice database...');

  // 1. Seed demo users
  const salt = bcrypt.genSaltSync(10);
  const commuterHash = bcrypt.hashSync('TransitPass123!', salt);
  const adminHash = bcrypt.hashSync('AdminPass123!', salt);
  const nowIso = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('user-demo-1', 'rajesh_transit', 'commuter@transitnotice.gov.in', commuterHash, 'commuter', nowIso);
  insertUser.run('user-demo-2', 'bmtc_dispatch', 'officer@bmtc.gov.in', adminHash, 'agency_admin', nowIso);

  // 2. Seed Agencies
  const insertAgency = db.prepare(`
    INSERT OR REPLACE INTO agencies (
      id, name, full_name, state, district, transport_types, feed_type,
      source_url, is_active, last_checked_at, status_message, requires_api_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);

  insertAgency.run(
    'delhi_otd', 'Delhi Transport (DTC & DMRC)',
    'Delhi Transport Corporation & Delhi Metro Rail Corp (OTD Portal)',
    'Delhi (NCT)', 'New Delhi',
    JSON.stringify(['bus', 'metro']), 'live_gtfs',
    'https://otd.delhi.gov.in', nowIso, 'Operational - Live GTFS & Realtime Alerts Active', 0
  );

  insertAgency.run(
    'bmtc_bengaluru', 'BMTC & Namma Metro',
    'Bengaluru Metropolitan Transport Corporation & BMRCL',
    'Karnataka', 'Bengaluru Urban',
    JSON.stringify(['bus', 'metro']), 'live_gtfs',
    'https://mybmtc.karnataka.gov.in', nowIso, 'Operational - ITS API & Metro Advisories Verified', 0
  );

  insertAgency.run(
    'best_mumbai', 'BEST & Maha Mumbai Metro',
    'Brihanmumbai Electric Supply & Transport & MMRDA Metro',
    'Maharashtra', 'Mumbai Suburban',
    JSON.stringify(['bus', 'metro']), 'advisory_verified',
    'https://www.bestundertaking.com', nowIso, 'Operational - Chalo Data Portal & MMRCL Circulars', 0
  );

  insertAgency.run(
    'mtc_chennai', 'MTC Chennai & CMRL Metro',
    'Metropolitan Transport Corporation Chennai & Chennai Metro Rail Ltd',
    'Tamil Nadu', 'Chennai',
    JSON.stringify(['bus', 'metro']), 'advisory_verified',
    'https://mtcbus.tn.gov.in', nowIso, 'Operational - Daily Route Diversion Bulletins', 0
  );

  insertAgency.run(
    'ksrtc_kerala', 'KSRTC Kerala & Kochi Metro',
    'Kerala State Road Transport Corporation & KMRL Kochi Water Metro',
    'Kerala', 'Ernakulam (Kochi)',
    JSON.stringify(['bus', 'ferry', 'metro']), 'advisory_verified',
    'https://www.onlineksrtcswift.com', nowIso, 'Operational - Ghat Road Monsoon & Water Metro Bulletins', 0
  );

  insertAgency.run(
    'indian_railways', 'Indian Railways (Suburban)',
    'Indian Railways / NTES & Suburban Commuter Rail',
    'Maharashtra', 'Mumbai Suburban',
    JSON.stringify(['rail']), 'advisory_verified',
    'https://enquiry.indianrail.gov.in', nowIso, 'Operational - Mega Block & Maintenance Schedules', 0
  );

  // 3. Seed Routes
  const insertRoute = db.prepare(`
    INSERT OR REPLACE INTO routes (
      id, agency_id, route_short_name, route_long_name, transport_type,
      state, district, origin, destination, coordinates, color
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Delhi routes
  insertRoute.run(
    'DTC-534', 'delhi_otd', '534', 'Mehrauli Terminal to Anand Vihar ISBT',
    'bus', 'Delhi (NCT)', 'South Delhi', 'Mehrauli Terminal', 'Anand Vihar ISBT',
    JSON.stringify([
      [77.1855, 28.5186], [77.2066, 28.5412], [77.2410, 28.5670],
      [77.2588, 28.5714], [77.2810, 28.5990], [77.3150, 28.6470]
    ]), '#06B6D4'
  );

  insertRoute.run(
    'DTC-429', 'delhi_otd', '429', 'Kashmere Gate ISBT to Nehru Place Terminal',
    'bus', 'Delhi (NCT)', 'Central Delhi', 'Kashmere Gate ISBT', 'Nehru Place Terminal',
    JSON.stringify([
      [77.2285, 28.6675], [77.2340, 28.6505], [77.2167, 28.6315],
      [77.2435, 28.5850], [77.2520, 28.5480]
    ]), '#38BDF8'
  );

  insertRoute.run(
    'DMRC-RED', 'delhi_otd', 'Red Line', 'Rithala to Shaheed Sthal (New Bus Adda)',
    'metro', 'Delhi (NCT)', 'Central Delhi', 'Rithala', 'Shaheed Sthal',
    JSON.stringify([
      [77.1065, 28.7208], [77.1480, 28.6980], [77.1950, 28.6740],
      [77.2285, 28.6675], [77.2750, 28.6750], [77.3480, 28.6720]
    ]), '#EF4444'
  );

  // Bengaluru routes
  insertRoute.run(
    'BMTC-500D', 'bmtc_bengaluru', '500-D', 'Hebbal to Central Silk Board via ORR',
    'bus', 'Karnataka', 'Bengaluru Urban', 'Hebbal TTMC', 'Central Silk Board',
    JSON.stringify([
      [77.5970, 13.0358], [77.6250, 13.0110], [77.6970, 12.9980],
      [77.6980, 12.9550], [77.6744, 12.9372], [77.6245, 12.9176]
    ]), '#10B981'
  );

  insertRoute.run(
    'BMTC-KIA9', 'bmtc_bengaluru', 'KIA-9', 'Kempegowda International Airport to Majestic',
    'bus', 'Karnataka', 'Bengaluru Urban', 'KIA Terminal 1 & 2', 'Kempegowda Bus Station (Majestic)',
    JSON.stringify([
      [77.7064, 13.1986], [77.6320, 13.1250], [77.5970, 13.0358],
      [77.5850, 12.9950], [77.5720, 12.9770]
    ]), '#3B82F6'
  );

  insertRoute.run(
    'BMRCL-YELLOW', 'bmtc_bengaluru', 'Yellow Line', 'RV Road to Bommasandra via Electronic City',
    'metro', 'Karnataka', 'Bengaluru Urban', 'RV Road Station', 'Bommasandra Terminal',
    JSON.stringify([
      [77.5800, 12.9215], [77.5990, 12.9180], [77.6245, 12.9176],
      [77.6530, 12.8710], [77.6850, 12.8390], [77.6980, 12.8150]
    ]), '#F59E0B'
  );

  // Mumbai routes
  insertRoute.run(
    'BEST-108', 'best_mumbai', '108', 'CSMT to Marine Drive / Backbay Depot',
    'bus', 'Maharashtra', 'Mumbai City', 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', 'Backbay Depot',
    JSON.stringify([
      [72.8358, 18.9400], [72.8315, 18.9370], [72.8282, 18.9322],
      [72.8258, 18.9240], [72.8205, 18.9180]
    ]), '#EC4899'
  );

  insertRoute.run(
    'BEST-340', 'best_mumbai', '340', 'Andheri Station East to Ghatkopar Depot',
    'bus', 'Maharashtra', 'Mumbai Suburban', 'Andheri East Station', 'Ghatkopar Depot',
    JSON.stringify([
      [72.8530, 19.1190], [72.8872, 19.0988], [72.9090, 19.0860]
    ]), '#F97316'
  );

  insertRoute.run(
    'METRO-LINE3', 'best_mumbai', 'Aqua Line 3', 'BKC to Aarey JVLR (Underground)',
    'metro', 'Maharashtra', 'Mumbai Suburban', 'BKC Station', 'Aarey JVLR',
    JSON.stringify([
      [72.8680, 19.0660], [72.8550, 19.0880], [72.8620, 19.1150],
      [72.8750, 19.1350], [72.8850, 19.1550]
    ]), '#06B6D4'
  );

  // Chennai routes
  insertRoute.run(
    'MTC-25G', 'mtc_chennai', '25G', 'Anna Square to Poonamallee via Porur',
    'bus', 'Tamil Nadu', 'Chennai', 'Anna Square (Marina)', 'Poonamallee Terminus',
    JSON.stringify([
      [80.2820, 13.0640], [80.2450, 13.0450], [80.2014, 13.0102],
      [80.1741, 13.0298], [80.1582, 13.0336], [80.1110, 13.0480]
    ]), '#8B5CF6'
  );

  insertRoute.run(
    'MTC-570', 'mtc_chennai', '570', 'CMBT Koyambedu to Siruseri IT Park via OMR',
    'bus', 'Tamil Nadu', 'Chennai', 'CMBT Koyambedu', 'Siruseri IT Park (SIPCOT)',
    JSON.stringify([
      [80.2050, 13.0680], [80.2150, 13.0150], [80.2458, 12.9862],
      [80.2390, 12.9150], [80.2280, 12.8310]
    ]), '#14B8A6'
  );

  insertRoute.run(
    'CMRL-BLUE', 'mtc_chennai', 'Blue Line', 'Wimco Nagar Depot to Chennai Airport',
    'metro', 'Tamil Nadu', 'Chennai', 'Wimco Nagar', 'Chennai Airport',
    JSON.stringify([
      [80.3010, 13.1700], [80.2850, 13.1050], [80.2760, 13.0820],
      [80.2450, 13.0450], [80.2010, 13.0100], [80.1650, 12.9820]
    ]), '#2563EB'
  );

  // Kerala routes
  insertRoute.run(
    'KSRTC-WAYANAD', 'ksrtc_kerala', 'Kozhikode-Wayanad SWIFT', 'Kozhikode to Kalpetta via Thamarassery Churam',
    'bus', 'Kerala', 'Wayanad', 'Kozhikode KSRTC Terminal', 'Kalpetta SWIFT Depot',
    JSON.stringify([
      [75.7800, 11.2580], [75.9821, 11.4889], [76.0145, 11.5120],
      [76.0825, 11.5540]
    ]), '#D97706'
  );

  insertRoute.run(
    'KMRL-WATER-1', 'ksrtc_kerala', 'Water Metro Route 1', 'High Court Jetty to Fort Kochi & Vypeen',
    'ferry', 'Kerala', 'Ernakulam (Kochi)', 'High Court Water Metro Jetty', 'Fort Kochi Jetty',
    JSON.stringify([
      [76.2750, 9.9830], [76.2480, 9.9750], [76.2428, 9.9678]
    ]), '#0284C7'
  );

  // Rail routes
  insertRoute.run(
    'IR-CR-MAIN', 'indian_railways', 'CR-Suburban', 'CSMT to Kalyan Junction (Main Line)',
    'rail', 'Maharashtra', 'Mumbai Suburban', 'CSMT Mumbai', 'Kalyan Junction',
    JSON.stringify([
      [72.8358, 18.9400], [72.8420, 18.9950], [72.8550, 19.0270],
      [72.8710, 19.0650], [72.9380, 19.1720], [73.1300, 19.2400]
    ]), '#DC2626'
  );

  // 4. Seed Stops
  const insertStop = db.prepare(`
    INSERT OR REPLACE INTO stops (id, route_id, stop_name, lat, lng, stop_sequence)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertStop.run('stop-534-1', 'DTC-534', 'Mehrauli Terminal', 28.5186, 77.1855, 1);
  insertStop.run('stop-534-2', 'DTC-534', 'IIT Delhi Gate', 28.5412, 77.2066, 2);
  insertStop.run('stop-534-3', 'DTC-534', 'AIIMS Ring Road', 28.5670, 77.2410, 3);
  insertStop.run('stop-534-4', 'DTC-534', 'Ashram Chowk (Diverted Bay)', 28.5714, 77.2588, 4);
  insertStop.run('stop-534-5', 'DTC-534', 'Anand Vihar ISBT', 28.6470, 77.3150, 5);

  insertStop.run('stop-500d-1', 'BMTC-500D', 'Hebbal TTMC', 13.0358, 77.5970, 1);
  insertStop.run('stop-500d-2', 'BMTC-500D', 'Manyata Tech Park', 13.0110, 77.6250, 2);
  insertStop.run('stop-500d-3', 'BMTC-500D', 'Marathahalli Bridge', 12.9550, 77.6980, 3);
  insertStop.run('stop-500d-4', 'BMTC-500D', 'Bellandur EcoSpace', 12.9279, 77.6744, 4);
  insertStop.run('stop-500d-5', 'BMTC-500D', 'Central Silk Board', 12.9176, 77.6245, 5);

  insertStop.run('stop-25g-1', 'MTC-25G', 'Anna Square', 13.0640, 80.2820, 1);
  insertStop.run('stop-25g-2', 'MTC-25G', 'Guindy Industrial Estate', 13.0102, 80.2014, 2);
  insertStop.run('stop-25g-3', 'MTC-25G', 'Ramapuram DLF IT Park', 13.0298, 80.1741, 3);
  insertStop.run('stop-25g-4', 'MTC-25G', 'Porur Junction (Temporary Diversion)', 13.0336, 80.1582, 4);
  insertStop.run('stop-25g-5', 'MTC-25G', 'Poonamallee Bus Stand', 13.0480, 80.1110, 5);

  // 5. Seed Coverage Registry
  const insertCoverage = db.prepare(`
    INSERT OR REPLACE INTO coverage_registry (
      id, state, district, coverage_level, transport_modes, notes, last_verified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const st of STATES_AND_DISTRICTS) {
    for (const dist of st.districts) {
      const covId = `cov-${st.state}-${dist.name}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
      insertCoverage.run(
        covId,
        st.state,
        dist.name,
        dist.level,
        JSON.stringify(dist.modes || ['bus']),
        dist.notes,
        nowIso
      );
    }
  }

  // 6. User preferences for demo commuter
  db.prepare(`
    INSERT OR REPLACE INTO user_preferences (
      id, user_id, state, district, route_id, agency_id, alert_types, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'pref-demo-1',
    'user-demo-1',
    'Delhi (NCT)',
    'South Delhi',
    'DTC-534',
    'delhi_otd',
    JSON.stringify(['diversion', 'delay', 'cancellation']),
    nowIso
  );

  console.log('[Seed] Database seeded successfully with demo users, routes, agencies, stops, and coverage catalog.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase
};
