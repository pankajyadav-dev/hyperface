import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Idempotent seed: only inserts sample rooms/employees when the tables
 * are empty, so re-running (e.g. on every container start) is safe.
 */
async function main() {
  const roomCount = await prisma.room.count();
  if (roomCount === 0) {
    await prisma.room.createMany({
      data: [
        { name: "Neptune", floor: 3, capacity: 6 },
        { name: "Saturn", floor: 3, capacity: 12 },
        { name: "Mercury", floor: 5, capacity: 4 },
        { name: "Jupiter", floor: 5, capacity: 20 },
        { name: "Pluto", floor: 7, capacity: 2 },
      ],
    });
    console.log("Seeded rooms.");
  }

  const empCount = await prisma.employee.count();
  if (empCount === 0) {
    await prisma.employee.createMany({
      data: [
        { name: "Aarav Sharma", email: "aarav@hyperface.io" },
        { name: "Diya Nair", email: "diya@hyperface.io" },
        { name: "Rohan Mehta", email: "rohan@hyperface.io" },
      ],
    });
    console.log("Seeded employees.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
