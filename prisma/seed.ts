import { PrismaClient } from "@prisma/client";
import additionalCategories from "../scripts/data/additional-categories.json";

const prisma = new PrismaClient();

const categories = [
  { name: "FinTech 💳", slug: "fintech", description: "Financial Technology", iconName: "Banknote" },
  { name: "EdTech 📚", slug: "edtech", description: "Educational Technology", iconName: "GraduationCap" },
  { name: "HealthTech 🏥", slug: "healthtech", description: "Healthcare Technology", iconName: "HeartPulse" },
  { name: "E-Commerce/D2C 🛒", slug: "e-commerce-d2c", description: "Electronic Commerce & Direct to Consumer", iconName: "ShoppingCart" },
  { name: "SaaS/B2B ☁️", slug: "saas-b2b", description: "Software as a Service & Business to Business", iconName: "Cloud" },
  { name: "AgriTech 🌾", slug: "agritech", description: "Agricultural Technology", iconName: "Sprout" },
  { name: "AI/ML 🤖", slug: "ai-ml", description: "Artificial Intelligence & Machine Learning", iconName: "Bot" },
  { name: "Logistics/Supply Chain 📦", slug: "logistics", description: "Logistics and Supply Chain", iconName: "Truck" },
  { name: "Gaming/Entertainment 🎮", slug: "gaming", description: "Gaming and Entertainment", iconName: "Gamepad2" },
  { name: "Real Estate/PropTech 🏢", slug: "proptech", description: "Property Technology", iconName: "Building" },
  { name: "Mobility/EV 🚗", slug: "mobility", description: "Mobility and Electric Vehicles", iconName: "Car" },
  { name: "FoodTech 🍔", slug: "foodtech", description: "Food Technology", iconName: "Utensils" },
  { name: "Social Impact/NGO 🌍", slug: "social-impact", description: "Social Impact and NGO", iconName: "Globe" },
  { name: "Creator Economy/Media 🎥", slug: "creator-economy", description: "Creator Economy and Media", iconName: "Video" },
  { name: "DevTools/Infrastructure 🛠️", slug: "devtools", description: "Developer Tools and Infrastructure", iconName: "Wrench" },
  { name: "Cybersecurity 🔒", slug: "cybersecurity", description: "Cybersecurity", iconName: "Shield" },
  { name: "Web3/Blockchain ⛓️", slug: "web3", description: "Web3 and Blockchain", iconName: "Link" },
  { name: "CleanTech/Sustainability ♻️", slug: "cleantech", description: "CleanTech and Sustainability", iconName: "Recycle" },
  ...additionalCategories,
];

async function main() {
  console.log("Seeding categories...");
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        iconName: cat.iconName,
        sortOrder: i,
      },
    });
  }

  console.log("Seeding app settings...");
  await prisma.appSetting.upsert({
    where: { key: "upvote_milestones" },
    update: {},
    create: { key: "upvote_milestones", value: JSON.stringify([10, 50, 100, 500]) },
  });
  await prisma.appSetting.upsert({
    where: { key: "maintenance_mode" },
    update: {},
    create: { key: "maintenance_mode", value: "false" },
  });

  const args = process.argv.slice(2);
  const createAdminIndex = args.indexOf("--create-admin");
  const roleIndex = args.indexOf("--role");

  if (createAdminIndex !== -1 && args[createAdminIndex + 1]) {
    const email = args[createAdminIndex + 1];
    let role = "admin";
    if (roleIndex !== -1 && args[roleIndex + 1]) {
      role = args[roleIndex + 1];
    }

    console.log(`Creating admin user: ${email} with role: ${role}`);
    
    // Creating user directly in DB because calling auth.api outside of a request context 
    // can sometimes be tricky depending on the exact Better Auth internal API version.
    await prisma.user.upsert({
      where: { email },
      update: { role },
      create: {
        email,
        name: email.split("@")[0],
        emailVerified: true,
        role: role,
      }
    });
    console.log("Admin user created.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
