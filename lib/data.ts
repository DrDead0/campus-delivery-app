// Static data for the campus delivery app

export const hostels = [
  "Aryabhatta Hostel",
  "Chanakya Hostel",
  "Ramanujan Hostel",
  "Kalam Hostel",
  "Gandhi Hostel",
  "Vivekananda Hostel",
];

export const deliveryItems = [
  {
    id: "1",
    name: "KitKat Chocolate",
    description: "Crispy wafer chocolate bar",
    price: 30,
    availability: "available" as const,
    emoji: "🍫",
  },
  {
    id: "2",
    name: "Lays Classic",
    description: "Crispy salted potato chips",
    price: 20,
    availability: "available" as const,
    emoji: "🥔",
  },
  {
    id: "3",
    name: "Dairy Milk",
    description: "Cadbury milk chocolate",
    price: 50,
    availability: "limited" as const,
    emoji: "🍫",
  },
  {
    id: "4",
    name: "Kurkure Masala",
    description: "Crunchy spicy snack",
    price: 20,
    availability: "available" as const,
    emoji: "🌶️",
  },
  {
    id: "5",
    name: "Snickers Bar",
    description: "Chocolate bar with peanuts",
    price: 40,
    availability: "available" as const,
    emoji: "🥜",
  },
  {
    id: "6",
    name: "Oreo Cookies",
    description: "Chocolate sandwich cookies",
    price: 30,
    availability: "available" as const,
    emoji: "🍪",
  },
  {
    id: "7",
    name: "Pringles Original",
    description: "Stacked potato crisps",
    price: 90,
    availability: "limited" as const,
    emoji: "🥨",
  },
  {
    id: "8",
    name: "Coca Cola",
    description: "Chilled soft drink 300ml",
    price: 40,
    availability: "available" as const,
    emoji: "🥤",
  },
  {
    id: "9",
    name: "Uncle Chips",
    description: "Spicy potato wafers",
    price: 20,
    availability: "available" as const,
    emoji: "🍟",
  },
  {
    id: "10",
    name: "Pepsi",
    description: "Chilled cola 300ml",
    price: 40,
    availability: "unavailable" as const,
    emoji: "🥤",
  },
  {
    id: "11",
    name: "Parle-G Biscuits",
    description: "Classic glucose biscuits",
    price: 10,
    availability: "available" as const,
    emoji: "🍪",
  },
  {
    id: "12",
    name: "5 Star Chocolate",
    description: "Caramel chocolate bar",
    price: 20,
    availability: "available" as const,
    emoji: "⭐",
  },
];

export const vendingMachines = [
  {
    id: "vm1",
    name: "Vending Machine A",
    hostel: "Aryabhatta Hostel",
    location: "Ground Floor",
    items: [
      {
        id: "v1",
        name: "Kurkure",
        price: 20,
        stock: "in-stock" as const,
        emoji: "🌶️",
      },
      {
        id: "v2",
        name: "Coke",
        price: 40,
        stock: "in-stock" as const,
        emoji: "🥤",
      },
      {
        id: "v3",
        name: "Lays Chips",
        price: 20,
        stock: "low" as const,
        emoji: "🥔",
      },
      {
        id: "v4",
        name: "Kit Kat",
        price: 30,
        stock: "out" as const,
        emoji: "🍫",
      },
      {
        id: "v5",
        name: "Parle-G",
        price: 10,
        stock: "in-stock" as const,
        emoji: "🍪",
      },
      {
        id: "v6",
        name: "Oreo",
        price: 30,
        stock: "in-stock" as const,
        emoji: "🍪",
      },
    ],
  },
  {
    id: "vm2",
    name: "Vending Machine B",
    hostel: "Chanakya Hostel",
    location: "First Floor",
    items: [
      {
        id: "v7",
        name: "Pepsi",
        price: 40,
        stock: "in-stock" as const,
        emoji: "🥤",
      },
      {
        id: "v8",
        name: "Uncle Chips",
        price: 20,
        stock: "in-stock" as const,
        emoji: "🍟",
      },
      {
        id: "v9",
        name: "Dairy Milk",
        price: 50,
        stock: "low" as const,
        emoji: "🍫",
      },
      {
        id: "v10",
        name: "Snickers",
        price: 40,
        stock: "in-stock" as const,
        emoji: "🥜",
      },
      {
        id: "v11",
        name: "Frooti",
        price: 30,
        stock: "out" as const,
        emoji: "🧃",
      },
      {
        id: "v12",
        name: "5 Star",
        price: 20,
        stock: "in-stock" as const,
        emoji: "⭐",
      },
    ],
  },
  {
    id: "vm3",
    name: "Vending Machine C",
    hostel: "Ramanujan Hostel",
    location: "Ground Floor Lobby",
    items: [
      {
        id: "v13",
        name: "Mineral Water",
        price: 20,
        stock: "in-stock" as const,
        emoji: "💧",
      },
      {
        id: "v14",
        name: "Red Bull",
        price: 120,
        stock: "low" as const,
        emoji: "🥫",
      },
      {
        id: "v15",
        name: "Pringles",
        price: 90,
        stock: "in-stock" as const,
        emoji: "🥨",
      },
      {
        id: "v16",
        name: "Bournvita Biscuits",
        price: 30,
        stock: "in-stock" as const,
        emoji: "🍪",
      },
      {
        id: "v17",
        name: "Munch",
        price: 20,
        stock: "in-stock" as const,
        emoji: "🍫",
      },
    ],
  },
];

export const events = [
  {
    id: "e1",
    name: "Tech Fest 2025",
    date: "2025-01-25",
    time: "10:00 AM",
    venue: "Main Auditorium",
    registrationLink: "https://forms.google.com/techfest2025",
    emoji: "💻",
  },
  {
    id: "e2",
    name: "Cultural Night",
    date: "2025-01-20",
    time: "6:00 PM",
    venue: "Open Air Theatre",
    registrationLink: "https://forms.google.com/culturalnight",
    emoji: "🎭",
  },
  {
    id: "e3",
    name: "Sports Day",
    date: "2025-01-22",
    time: "8:00 AM",
    venue: "Sports Complex",
    registrationLink: "https://forms.google.com/sportsday",
    emoji: "⚽",
  },
  {
    id: "e4",
    name: "Coding Hackathon",
    date: "2025-02-01",
    time: "9:00 AM",
    venue: "Computer Lab",
    registrationLink: "https://forms.google.com/hackathon",
    emoji: "👨‍💻",
  },
  {
    id: "e5",
    name: "Music Concert",
    date: "2025-02-05",
    time: "7:00 PM",
    venue: "Campus Grounds",
    registrationLink: "https://forms.google.com/concert",
    emoji: "🎸",
  },
];

export const categories = [
  {
    name: "Burgers",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    name: "Pizza",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    name: "Biryani",
    image:
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    name: "Rolls",
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Drinks",
    image:
      "https://images.unsplash.com/photo-1543573852-1a71a6ce19bc?w=500&auto=format&fit=crop&q=60",
  },
];
