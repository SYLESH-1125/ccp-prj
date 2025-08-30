// Script to populate Firebase with real Chennai playgrounds
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Real Chennai playgrounds data
const chennaiPlaygrounds = [
  {
    name: "Nehru Park",
    address: "Kamarajar Salai, Triplicane, Chennai, Tamil Nadu 600005",
    latitude: 13.0569,
    longitude: 80.2844,
    description: "Large park with playground facilities and sports courts",
    amenities: ["Swings", "Slides", "Basketball Court", "Walking Track"],
    status: "Good",
    activeIssues: 0,
    lastInspection: "25/08/2025"
  },
  {
    name: "Nandanam Children's Park",
    address: "Nandanam, Chennai, Tamil Nadu 600035",
    latitude: 13.0338,
    longitude: 80.2340,
    description: "Dedicated children's park with modern play equipment",
    amenities: ["Swings", "Slides", "Seesaw", "Sandbox", "Climbing Wall"],
    status: "Good",
    activeIssues: 1,
    lastInspection: "28/08/2025"
  },
  {
    name: "Semmozhi Poonga",
    address: "Cathedral Rd, Gopalapuram, Chennai, Tamil Nadu 600086",
    latitude: 13.0569,
    longitude: 80.2472,
    description: "Botanical garden with children's play area",
    amenities: ["Nature Trail", "Slides", "Swings", "Garden"],
    status: "Good",
    activeIssues: 0,
    lastInspection: "27/08/2025"
  },
  {
    name: "Elliot's Beach Playground",
    address: "Besant Nagar, Chennai, Tamil Nadu 600090",
    latitude: 12.9988,
    longitude: 80.2669,
    description: "Beachside playground with ocean views",
    amenities: ["Swings", "Slides", "Beach Access", "Walking Path"],
    status: "Attention",
    activeIssues: 2,
    lastInspection: "20/08/2025"
  },
  {
    name: "Anna Nagar Tower Park",
    address: "2nd Ave, Anna Nagar, Chennai, Tamil Nadu 600040",
    latitude: 13.0878,
    longitude: 80.2085,
    description: "Popular park with well-maintained playground facilities",
    amenities: ["Swings", "Slides", "Monkey Bars", "Basketball Court"],
    status: "Good",
    activeIssues: 0,
    lastInspection: "29/08/2025"
  },
  {
    name: "Guindy National Park Children's Area",
    address: "Guindy, Chennai, Tamil Nadu 600025",
    latitude: 13.0067,
    longitude: 80.2206,
    description: "Nature park with dedicated children's play zone",
    amenities: ["Nature Trail", "Swings", "Slides", "Wildlife Viewing"],
    status: "Good",
    activeIssues: 1,
    lastInspection: "26/08/2025"
  },
  {
    name: "Adyar Eco Park",
    address: "Adyar, Chennai, Tamil Nadu 600020",
    latitude: 13.0067,
    longitude: 80.2572,
    description: "Eco-friendly park with modern playground equipment",
    amenities: ["Swings", "Slides", "Climbing Frame", "Eco Trail"],
    status: "Good",
    activeIssues: 0,
    lastInspection: "28/08/2025"
  },
  {
    name: "Velachery Lake Park",
    address: "Velachery, Chennai, Tamil Nadu 600042",
    latitude: 12.9756,
    longitude: 80.2206,
    description: "Lakeside park with children's recreational facilities",
    amenities: ["Swings", "Slides", "Lake View", "Jogging Track"],
    status: "Attention",
    activeIssues: 3,
    lastInspection: "22/08/2025"
  },
  {
    name: "Nungambakkam YMCA Playground",
    address: "Nungambakkam High Rd, Chennai, Tamil Nadu 600034",
    latitude: 13.0569,
    longitude: 80.2392,
    description: "Well-equipped playground with sports facilities",
    amenities: ["Swings", "Slides", "Basketball Court", "Tennis Court"],
    status: "Good",
    activeIssues: 1,
    lastInspection: "27/08/2025"
  },
  {
    name: "Kotturpuram Playground",
    address: "Kotturpuram, Chennai, Tamil Nadu 600085",
    latitude: 13.0206,
    longitude: 80.2411,
    description: "Community playground with basic facilities",
    amenities: ["Swings", "Slides", "Seesaw"],
    status: "Urgent",
    activeIssues: 4,
    lastInspection: "15/08/2025"
  }
];

async function clearExistingData() {
  console.log('Clearing existing playground data...');
  const playgroundsRef = collection(db, 'playgrounds');
  const snapshot = await getDocs(playgroundsRef);
  
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  console.log(`Deleted ${snapshot.docs.length} existing playgrounds`);
}

async function seedPlaygrounds() {
  console.log('Starting to seed Chennai playgrounds...');
  
  try {
    // Clear existing data first
    await clearExistingData();
    
    // Add new Chennai playgrounds
    const playgroundsRef = collection(db, 'playgrounds');
    
    for (const playground of chennaiPlaygrounds) {
      await addDoc(playgroundsRef, playground);
      console.log(`Added: ${playground.name}`);
    }
    
    console.log(`Successfully seeded ${chennaiPlaygrounds.length} Chennai playgrounds!`);
    
  } catch (error) {
    console.error('Error seeding playgrounds:', error);
  }
}

seedPlaygrounds();
