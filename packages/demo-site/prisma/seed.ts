import { asyncMap, generateRevocationList } from "@centre/verity"
import { loadEnvConfig } from "@next/env"
import { PrismaClient, User } from "@prisma/client"
import { saveRevocationList } from "../lib/database"
import { credentialSigner } from "../lib/signer"

const prisma = new PrismaClient()

type UserInput = Partial<User> & { email: string }
// Users
const users: UserInput[] = [
  {
    email: "alice@test.com",
    password: "testing",
    role: "admin",
    jumioScore: 80,
    ofacScore: 0,
    creditScore: 750
  },
  {
    email: "bob@test.com",
    password: "testing",
    role: "member",
    jumioScore: 10,
    ofacScore: 1,
    creditScore: 320
  }
]

async function main() {
  loadEnvConfig(process.cwd(), /* dev: */ true)

  await asyncMap(users, async (user) => {
    console.info(`Creating user ${user.email}...`)
    return prisma.user.create({
      data: user
    })
  })

  // Revocation List
  console.info(`Generating revocation lists ...`)
  await createRevocationList()
  await createRevocationList()
}

async function createRevocationList() {
  const url = process.env.REVOCATION_URL
  const issuer = process.env.ISSUER_DID
  const list = await generateRevocationList([], url, issuer, credentialSigner())
  return saveRevocationList(list)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
