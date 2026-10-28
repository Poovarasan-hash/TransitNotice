/**
 * India Geographic & Transit Coordinate Data
 * Includes center coordinates, zoom levels, sample GeoJSON bounds for states,
 * and key transit hubs across India.
 */

export const INDIA_MAP_CENTER = [21.7679, 78.8718]; // Geographical center of India
export const INDIA_DEFAULT_ZOOM = 5;

export const STATE_COORDINATES = {
  'Delhi (NCT)': { center: [28.6139, 77.2090], zoom: 11 },
  'Karnataka': { center: [12.9716, 77.5946], zoom: 9 },
  'Maharashtra': { center: [19.0760, 72.8777], zoom: 9 },
  'Tamil Nadu': { center: [13.0827, 80.2707], zoom: 9 },
  'Kerala': { center: [10.1632, 76.6413], zoom: 8 },
  'Telangana': { center: [17.3850, 78.4867], zoom: 9 },
  'West Bengal': { center: [22.5726, 88.3639], zoom: 9 },
  'Gujarat': { center: [23.0225, 72.5714], zoom: 9 },
  'Rajasthan': { center: [26.9124, 75.7873], zoom: 9 },
  'Uttar Pradesh': { center: [26.8467, 80.9462], zoom: 8 },
  'Punjab': { center: [31.1471, 75.3412], zoom: 8 },
  'Haryana': { center: [28.4595, 77.0266], zoom: 9 },
  'Andhra Pradesh': { center: [16.5062, 80.6480], zoom: 8 },
  'Madhya Pradesh': { center: [23.2599, 77.4126], zoom: 8 },
  'Odisha': { center: [20.2961, 85.8245], zoom: 8 },
  'Bihar': { center: [25.5941, 85.1376], zoom: 8 },
  'Assam': { center: [26.1445, 91.7362], zoom: 8 },
  'Jammu & Kashmir': { center: [34.0837, 74.7973], zoom: 8 },
  'Goa': { center: [15.2993, 74.1240], zoom: 10 },
  'Himachal Pradesh': { center: [31.1048, 77.1734], zoom: 8 },
  'Uttarakhand': { center: [30.3165, 78.0322], zoom: 8 }
};

export const DISTRICT_COORDINATES = {
  'Central Delhi': [28.6448, 77.2167],
  'New Delhi': [28.6139, 77.2090],
  'South Delhi': [28.5400, 77.2200],
  'North Delhi': [28.7100, 77.1500],
  'West Delhi': [28.6500, 77.1000],
  'East Delhi': [28.6200, 77.2900],
  'Bengaluru Urban': [12.9716, 77.5946],
  'Mysuru': [12.2958, 76.6394],
  'Mumbai Suburban': [19.1136, 72.8697],
  'Mumbai City': [18.9388, 72.8354],
  'Pune': [18.5204, 73.8567],
  'Chennai': [13.0827, 80.2707],
  'Coimbatore': [11.0168, 76.9558],
  'Ernakulam (Kochi)': [9.9816, 76.2999],
  'Thiruvananthapuram': [8.5241, 76.9366],
  'Wayanad': [11.6854, 76.1320],
  'Hyderabad': [17.3850, 78.4867],
  'Rangareddy': [17.3100, 78.4500],
  'Kolkata': [22.5726, 88.3639],
  'Ahmedabad': [23.0225, 72.5714],
  'Jaipur': [26.9124, 75.7873],
  'Lucknow': [26.8467, 80.9462],
  'Gautam Buddha Nagar (Noida)': [28.5355, 77.3910],
  'Kanpur': [26.4499, 80.3319],
  'Gurugram': [28.4595, 77.0266],
  'Amritsar': [31.6340, 74.8723],
  'Bhopal': [23.2599, 77.4126],
  'Patna': [25.5941, 85.1376],
  'Bhubaneswar': [20.2961, 85.8245],
  'Srinagar': [34.0837, 74.7973],
  'North Goa': [15.5494, 73.8122],
  'Shimla': [31.1048, 77.1734]
};

// GeoJSON approximate boundaries for major Indian states to render outline polygons on map
export const STATE_POLYGONS = {
  'Delhi (NCT)': [
    [28.88, 77.05], [28.85, 77.28], [28.60, 77.35],
    [28.40, 77.25], [28.45, 76.90], [28.75, 76.95], [28.88, 77.05]
  ],
  'Karnataka': [
    [15.5, 74.2], [18.4, 77.2], [17.2, 77.7],
    [13.8, 78.5], [12.0, 77.0], [11.6, 75.8], [14.0, 74.4], [15.5, 74.2]
  ],
  'Maharashtra': [
    [21.8, 73.8], [21.5, 79.2], [19.0, 80.8],
    [17.5, 78.0], [15.8, 73.8], [19.0, 72.8], [20.5, 72.7], [21.8, 73.8]
  ],
  'Tamil Nadu': [
    [13.5, 80.2], [12.5, 79.8], [10.5, 79.8],
    [8.2, 77.5], [8.7, 77.3], [11.5, 76.8], [12.5, 78.5], [13.5, 80.2]
  ],
  'Kerala': [
    [12.8, 74.9], [12.2, 75.3], [11.5, 76.1],
    [10.2, 76.6], [8.3, 77.1], [8.8, 76.6], [10.5, 75.9], [12.8, 74.9]
  ]
};
