
require('dotenv').config();
const mongoose = require('mongoose');
const CategoryPackage = require('../models/CategoryPackage'); // adjust path if needed

const MONGO_URI = process.env.MONGO_URL ;

const categories = [
  {
    categoryKey: 'dubai_freezones',
    categoryTitle: 'Dubai Freezones',
    pages: [
      { pageName: 'JAFZA', packages: [] },
      { pageName: 'DMCC', packages: [] },
      { pageName: 'DAFZA', packages: [] },
      { pageName: 'DWC', packages: [] },
      { pageName: 'Meydan', packages: [] },
      { pageName: 'D3', packages: [] },
      { pageName: 'IFZA', packages: [] }
    ]
  },
  {
    categoryKey: 'abu_dhabi_freezones',
    categoryTitle: 'Abu Dhabi Freezones',
    pages: [
      { pageName: 'ADGM', packages: [] },
      { pageName: 'KIZAD', packages: [] },
      { pageName: 'Masdar City', packages: [] },
      { pageName: 'Twofour54', packages: [] }
    ]
  },
  {
    categoryKey: 'sharjah_freezones',
    categoryTitle: 'Sharjah Freezones',
    pages: [
      { pageName: 'SAIF', packages: [] },
      { pageName: 'Hamriyah', packages: [] },
      { pageName: 'SHAMS', packages: [] },
      { pageName: 'SPCFZ', packages: [] }
    ]
  },
  {
    categoryKey: 'ras_al_khaimah_freezones',
    categoryTitle: 'Ras Al Khaimah Freezones',
    pages: [
      { pageName: 'RAKEZ', packages: [] },
      { pageName: 'RAK Maritime City', packages: [] }
    ]
  },
  {
    categoryKey: 'ajman_freezones',
    categoryTitle: 'Ajman Freezones',
    pages: [
      { pageName: 'AFZ', packages: [] },
      { pageName: 'AMCFZ', packages: [] }
    ]
  },
  {
    categoryKey: 'fujairah_uaq',
    categoryTitle: 'Fujairah & Umm Al Quwain',
    pages: [
      { pageName: 'Fujairah Free Zone', packages: [] },
      { pageName: 'Fujairah Creative City', packages: [] },
      { pageName: 'UAQFTZ', packages: [] }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    for (const cat of categories) {
      const exists = await CategoryPackage.findOne({ categoryKey: cat.categoryKey });
      if (exists) {
        console.log(`Category already exists, skipping: ${cat.categoryKey}`);
        continue;
      }
      await CategoryPackage.create(cat);
      console.log(`Inserted category: ${cat.categoryKey}`);
    }

    console.log('Seeding completed');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
