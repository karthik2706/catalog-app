import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting countries and currencies seeding...')

  // Create Currencies
  const currencies = [
    { id: 'cur_usd', name: 'US Dollar', code: 'USD', symbol: '$', decimalPlaces: 2 },
    { id: 'cur_eur', name: 'Euro', code: 'EUR', symbol: '€', decimalPlaces: 2 },
    { id: 'cur_gbp', name: 'British Pound', code: 'GBP', symbol: '£', decimalPlaces: 2 },
    { id: 'cur_inr', name: 'Indian Rupee', code: 'INR', symbol: '₹', decimalPlaces: 2 },
    { id: 'cur_cad', name: 'Canadian Dollar', code: 'CAD', symbol: 'C$', decimalPlaces: 2 },
    { id: 'cur_aud', name: 'Australian Dollar', code: 'AUD', symbol: 'A$', decimalPlaces: 2 },
    { id: 'cur_jpy', name: 'Japanese Yen', code: 'JPY', symbol: '¥', decimalPlaces: 0 },
    { id: 'cur_cny', name: 'Chinese Yuan', code: 'CNY', symbol: '¥', decimalPlaces: 2 },
    { id: 'cur_brl', name: 'Brazilian Real', code: 'BRL', symbol: 'R$', decimalPlaces: 2 },
    { id: 'cur_mxn', name: 'Mexican Peso', code: 'MXN', symbol: '$', decimalPlaces: 2 },
  ]

  for (const currencyData of currencies) {
    await prisma.currency.upsert({
      where: { id: currencyData.id },
      update: {},
      create: currencyData,
    })
    console.log(`✅ Currency created: ${currencyData.name}`)
  }

  // Create Countries
  const countries = [
    { id: 'ctry_us', name: 'United States', code: 'US', currencyId: 'cur_usd' },
    { id: 'ctry_ca', name: 'Canada', code: 'CA', currencyId: 'cur_cad' },
    { id: 'ctry_gb', name: 'United Kingdom', code: 'GB', currencyId: 'cur_gbp' },
    { id: 'ctry_de', name: 'Germany', code: 'DE', currencyId: 'cur_eur' },
    { id: 'ctry_fr', name: 'France', code: 'FR', currencyId: 'cur_eur' },
    { id: 'ctry_it', name: 'Italy', code: 'IT', currencyId: 'cur_eur' },
    { id: 'ctry_es', name: 'Spain', code: 'ES', currencyId: 'cur_eur' },
    { id: 'ctry_in', name: 'India', code: 'IN', currencyId: 'cur_inr' },
    { id: 'ctry_au', name: 'Australia', code: 'AU', currencyId: 'cur_aud' },
    { id: 'ctry_jp', name: 'Japan', code: 'JP', currencyId: 'cur_jpy' },
    { id: 'ctry_cn', name: 'China', code: 'CN', currencyId: 'cur_cny' },
    { id: 'ctry_br', name: 'Brazil', code: 'BR', currencyId: 'cur_brl' },
    { id: 'ctry_mx', name: 'Mexico', code: 'MX', currencyId: 'cur_mxn' },
  ]

  for (const countryData of countries) {
    await prisma.country.upsert({
      where: { id: countryData.id },
      update: {},
      create: countryData,
    })
    console.log(`✅ Country created: ${countryData.name}`)
  }

  // Update existing clients to have default country and currency
  const existingClients = await prisma.client.findMany()
  const defaultCountry = await prisma.country.findFirst({ where: { code: 'US' } })
  const defaultCurrency = await prisma.currency.findFirst({ where: { code: 'USD' } })

  if (defaultCountry && defaultCurrency) {
    for (const client of existingClients) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          countryId: defaultCountry.id,
          currencyId: defaultCurrency.id,
        },
      })
      console.log(`✅ Updated client: ${client.name}`)
    }
  }

  console.log('🎉 Countries and currencies seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
