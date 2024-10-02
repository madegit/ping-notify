import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

async function checkWebsiteStatus(url: string): Promise<'up' | 'down'> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Set a 5-second timeout

    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'PingNotify/1.0'
      },
      signal: controller.signal 
    });

    clearTimeout(timeoutId); // Clear the timeout if the request completes successfully
    return response.ok ? 'up' : 'down'
  } catch (error) {
    console.error(`Error checking ${url}:`, error)
    return 'down'
  }
}
async function sendNotificationEmail(to: string, websiteUrl: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Website Down: ${websiteUrl}`,
      text: `Your website ${websiteUrl} is currently offline. Please check and resolve the issue.`,
      html: `<p>Your website <strong>${websiteUrl}</strong> is currently offline. Please check and resolve the issue.</p>`,
    })
    console.log(`Notification email sent for ${websiteUrl}`)
  } catch (error) {
    console.error(`Error sending notification email for ${websiteUrl}:`, error)
  }
}

export async function checkAllWebsites() {
  try {
    const websites = await prisma.website.findMany({
      include: { user: true },
    })

    for (const website of websites) {
      const status = await checkWebsiteStatus(website.url)

      if (status === 'down' && website.status !== 'down') {
        await sendNotificationEmail(website.user.email, website.url)
      }

      await prisma.website.update({
        where: { id: website.id },
        data: { status },
      })
    }

    console.log('All websites checked successfully')
  } catch (error) {
    console.error('Error in checkAllWebsites:', error)
  } finally {
    await prisma.$disconnect()
  }
}