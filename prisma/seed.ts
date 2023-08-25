import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    name: "Max",
    email: "max@stijlbreuk.nl",
    password: "max123",
  },
  {
    name: "Mark",
    email: "mark@stijlbreuk.nl",
    password: "mark123",
  },
  {
    name: "Nino",
    email: "nino@stijlbreuk.nl",
    password: "nino123",
  },
  {
    name: "Paul",
    email: "paul@stijlbreuk.nl",
    password: "paul123",
  },
  {
    name: "Aron",
    email: "aron@stijlbreuk.nl",
    password: "aron123",
  },
  {
    name: "Aron",
    email: "aron.heesakkers@stijlbreuk.nl",
    password: "aron123",
  },
  {
    name: "Frank",
    email: "frank@stijlbreuk.nl",
    password: "frank123",
  },
  {
    name: "Stef",
    email: "stef@stijlbreuk.nl",
    password: "stef123",
  },
  {
    name: "Jeroen",
    email: "jeroen@stijlbreuk.nl",
    password: "jeroen123",
  },
  {
    name: "Werner",
    email: "werner@stijlbreuk.nl",
    password: "werner123",
  },
];

async function main() {
  console.log(`Start seeding ...`);

  for (const u of userData) {
    const user = await prisma.user.create({
      data: u,
    });

    console.log(`Created user with id: ${user.id}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
