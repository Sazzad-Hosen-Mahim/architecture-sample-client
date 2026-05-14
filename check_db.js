const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPayments() {
  const projectId = '8d1b4e53-606b-41f7-a5b1-5de56dfceed4';
  
  console.log(`Checking payments for project: ${projectId}`);
  
  const payments = await prisma.payment.findMany({
    where: { projectRequestId: projectId }
  });
  
  console.log('Payments found:', JSON.stringify(payments, null, 2));
  
  const project = await prisma.projectRequest.findUnique({
    where: { id: projectId },
    select: { consultationPaymentId: true }
  });
  
  console.log('Project Consultation ID:', project?.consultationPaymentId);
  
  await prisma.$disconnect();
}

checkPayments().catch(err => {
  console.error(err);
  process.exit(1);
});
