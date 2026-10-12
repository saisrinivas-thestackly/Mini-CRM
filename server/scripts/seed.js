import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Activity } from '../src/models/Activity.js';
import { Customer } from '../src/models/Customer.js';
import { Deal } from '../src/models/Deal.js';
import { Task } from '../src/models/Task.js';
import { User } from '../src/models/User.js';
import { localRanges } from '../src/utils/dates.js';

const { SEED_EMAIL, SEED_PASSWORD, SEED_NAME = 'Demo User', SEED_TZ_OFFSET = '-330' } = process.env;
if (!SEED_EMAIL || !SEED_PASSWORD || SEED_PASSWORD.length < 8) {
  console.error('Set SEED_EMAIL and SEED_PASSWORD (min 8 chars) before seeding.');
  process.exit(1);
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const TZ = Number(SEED_TZ_OFFSET) || 0;
const { dayStart, monthStart } = localRanges(new Date(), TZ);
const at = (days, hour = 10) => new Date(dayStart.getTime() + days * DAY + hour * HOUR);
const closedAt = (daysAgo) => {
  const date = at(-daysAgo, 12);
  return daysAgo <= 14 && date < monthStart ? new Date(monthStart.getTime() + 12 * HOUR) : date;
};

const CUSTOMERS = [
  ['Deanna', 'Annis', 'Annis Interiors', 'active', ['475 Spruce Drive', 'Pittsburgh', 'PA', '23592']],
  ['Andrea', 'Willis', 'Willis & Co', 'active', ['1952 Chicago Avenue', 'Fresno', 'CA', '93711']],
  ['Brent', 'Rodrigues', 'Rodrigues Realty', 'active', ['4409 Haul Road', 'Saint Paul', 'MN', '55102']],
  ['Andrew', 'Sommers', 'Sommers Studio', 'lead', ['579 Godfrey Street', 'Monitor', 'OR', '97071']],
  ['Edgar', 'Cavins', 'Cavins Holdings', 'active', ['2705 Cantebury Drive', 'New York', 'NY', '10011']],
  ['Theresa', 'Wells', 'Wells Medical', 'lead', ['2893 Austin Secret Lane', 'Parowan', 'UT', '12413']],
  ['George', 'Gamble', 'Gamble Logistics', 'inactive', ['2213 Thorn Street', 'Glenrock', 'WY', '12345']],
  ['Barbara', 'Anderson', 'Anderson Legal', 'active', ['3290 Levy Court', 'Lawrence', 'MA', '01840']],
  ['Priya', 'Raman', 'Raman Foods', 'lead', ['416 Woodland Terrace', 'New York', 'NY', '10002']],
  ['Marcus', 'Lee', 'Lee Architecture', 'active', ['1824 Turkey Pen Road', 'Cleveland', 'OH', '12345']],
  ['Sofia', 'Martinez', 'Casa Martinez', 'inactive', ['47 Spruce Drive', 'Quantico', 'VA', '22134']],
  ['Kenji', 'Tanaka', 'Tanaka Design', 'lead', ['165 Belmont Drive', 'Parowan', 'UT', '84761']],
];

const DEALS = [
  [0, '319 Haul Road', 5750, 'proposal', 2],
  [1, '47 Spruce Drive', 5750, 'qualified', 3],
  [2, '165 Belmont Drive', 5750, 'lead', 4],
  [9, '1538 Hammer Road', 5750, 'proposal', 5],
  [9, '1824 Turkey Pen Road', 12000, 'qualified', 1],
  [5, '2893 Austin Secret Lane', 6000, 'proposal', 6],
  [3, '579 Godfrey Street', 4200, 'lead', 9],
  [4, '2705 Cantebury Drive', 9800, 'won', -6, 5],
  [7, '3290 Levy Court', 6000, 'won', -12, 10],
  [7, '416 Woodland Terrace', 7400, 'qualified', 8],
  [8, 'Raman Foods HQ fit-out', 15500, 'lead', 12],
  [6, '2213 Thorn Street', 3100, 'lost', -20, 18],
  [10, 'Casa Martinez kitchen', 5200, 'lost', -30, 25],
  [11, 'Tanaka studio refresh', 8300, 'proposal', 10],
  [1, '1952 Chicago Avenue', 6000, 'won', -40, 35],
];

const ACTIVITIES = [
  'Evaluation and removal of the old system',
  'Installation of the new air conditioning system',
  'Installation or inspection of your thermostat',
  'Site visit and measurements',
];

async function seed() {
  await mongoose.connect(env.MONGO_URI);

  const email = SEED_EMAIL.toLowerCase().trim();
  let user = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  if (user) {
    user.passwordHash = passwordHash;
    await user.save();
  } else {
    user = await User.create({ name: SEED_NAME, email, passwordHash });
  }
  const owner = user._id;

  await Promise.all([
    Activity.deleteMany({ owner }),
    Task.deleteMany({ owner }),
    Deal.deleteMany({ owner }),
    Customer.deleteMany({ owner }),
  ]);

  const customers = await Customer.insertMany(
    CUSTOMERS.map(([firstName, lastName, company, status, [street, city, state, zip]], i) => ({
      owner,
      firstName,
      lastName,
      company,
      status,
      email: `${firstName}${lastName}`.toLowerCase() + '@example.com',
      phone: `617-952-40${String(10 + i).padStart(2, '0')}`,
      address: { street, city, state, zip },
      notes: i % 3 === 0 ? 'Prefers morning appointments. Call before visiting.' : '',
      createdAt: at(-60 + i * 4),
    })),
  );

  const deals = await Deal.insertMany(
    DEALS.map(([ci, title, value, stage, apptDays, closedAgo], i) => {
      const c = customers[ci];
      return {
        owner,
        customer: c._id,
        title,
        value,
        stage,
        address: { street: title.match(/^\d/) ? title : c.address.street, city: c.address.city, state: c.address.state, zip: c.address.zip },
        appointmentDate: at(apptDays, 8 + (i % 8)),
        expectedCloseDate: at(apptDays + 14),
        closedAt: closedAgo !== undefined ? closedAt(closedAgo) : null,
        roomArea: [25, 60, 100, 45][i % 4],
        people: [4, 10, 6, 2][i % 4],
        roomAccess: ['keys_with_doorman', 'keys_in_lockbox', 'customer_present'][i % 3],
        instructions: 'At risus viverra adipiscing at in tellus. Please call the customer 30 minutes before arriving.',
      };
    }),
  );

  await Activity.insertMany(
    deals.flatMap((deal, i) =>
      ACTIVITIES.slice(0, 1 + (i % 3)).map((description, j) => ({
        owner,
        deal: deal._id,
        description,
        date: at(-(j + 1) * 2 - i, 9 + j),
      })),
    ),
  );

  const TASKS = [
    ['Meeting with partners', -3, 'high', false, 0],
    ['Web conference agenda', -1, 'medium', false, 4],
    ['Call Deanna about proposal', 0, 'high', false, 0],
    ['Send quote for Turkey Pen Road', 0, 'medium', false, 9],
    ['Lunch with Steve', 2, 'low', false, null],
    ['Weekly meeting', 3, 'medium', false, null],
    ['Add new services', 5, 'low', false, null],
    ['Sales report due', 7, 'high', false, null],
    ['Upload new legals (terms & conditions)', -5, 'medium', true, null],
    ['Follow up with Barbara', 1, 'medium', false, 7],
    ['Confirm access keys with doorman', 4, 'low', false, 4],
    ['Review Tanaka moodboard', -2, 'low', true, 11],
  ];
  await Task.insertMany(
    TASKS.map(([title, days, priority, done, ci], i) => {
      const customer = ci === null ? null : customers[ci]._id;
      const deal = ci === null ? null : deals.find((d) => String(d.customer) === String(customer))?._id ?? null;
      return {
        owner,
        title,
        dueDate: days === 0 ? at(0, 21 + (i % 2)) : at(days, 9 + (i % 8)),
        priority,
        done,
        completedAt: done ? at(days) : null,
        customer,
        deal,
        description: i % 2 ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' : '',
      };
    }),
  );

  console.info(`Seeded demo account: ${customers.length} customers, ${deals.length} deals, ${TASKS.length} tasks.`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
