/**
 * Complete System Demo
 * Demonstrates voice templates + CSV status tracking integration
 */

import fs from 'fs';
import path from 'path';
import { 
  addStatusColumns, 
  updateCSVStatus, 
  getStatusFromCSV,
  EMAIL_STATUSES,
  VOICE_STATUSES 
} from '../src/csv-status-tracker.js';
import { 
  getRandomVoiceTemplate, 
  personalizeVoiceScript 
} from '../src/voice-templates/index.js';

console.log('🎯 Complete Lead Generator System Demo\n');

// Create demo CSV file
const demoCSVPath = './demo-leads.csv';
const demoCSVContent = `Name,Email,PhoneNumber,Company,Industry
John Smith,john@acme.com,+1234567890,Acme Corp,Technology
Jane Doe,jane@techco.com,+1987654321,TechCo Inc,Software
Bob Johnson,bob@startup.com,+1555123456,StartupXYZ,Fintech`;

console.log('📄 Creating demo CSV file...');
fs.writeFileSync(demoCSVPath, demoCSVContent);

// Add status columns
console.log('📊 Adding status tracking columns...');
const statusResult = addStatusColumns(demoCSVPath);
console.log(`   Result: ${statusResult.message}`);

// Demo voice template system
console.log('\n🎙️ Voice Template System Demo');
const template = getRandomVoiceTemplate();
console.log(`   Selected template: ${template.name} (${template.tone})`);

const sampleContact = {
  Name: 'John Smith',
  Company: 'Acme Corp',
  Industry: 'Technology'
};

const config = {
  callerName: 'Sarah Johnson',
  companyName: 'LeadGen Solutions',
  calendlyLink: 'https://calendly.com/sarah'
};

const personalizedScript = personalizeVoiceScript(template, sampleContact, config);
console.log('\n📞 Personalized Voice Script:');
console.log('─'.repeat(60));
console.log(personalizedScript);
console.log('─'.repeat(60));

// Demo status tracking
console.log('\n📈 Status Tracking Demo');

// Simulate email campaign
console.log('\n📧 Email Campaign Simulation:');
await updateCSVStatus(demoCSVPath, {
  email: 'john@acme.com',
  emailStatus: EMAIL_STATUSES.SENT,
  emailNotes: 'Initial outreach email sent'
});
console.log('   ✅ John Smith - Email sent');

await updateCSVStatus(demoCSVPath, {
  email: 'jane@techco.com',
  emailStatus: EMAIL_STATUSES.OPENED,
  emailNotes: 'Email opened, no response yet'
});
console.log('   👀 Jane Doe - Email opened');

await updateCSVStatus(demoCSVPath, {
  email: 'bob@startup.com',
  emailStatus: EMAIL_STATUSES.REPLIED,
  emailNotes: 'Interested in learning more'
});
console.log('   💬 Bob Johnson - Email replied');

// Simulate voice campaign
console.log('\n📞 Voice Campaign Simulation:');
await updateCSVStatus(demoCSVPath, {
  phoneNumber: '+1234567890',
  voiceStatus: VOICE_STATUSES.ANSWERED,
  voiceNotes: 'Spoke with John, interested in demo'
});
console.log('   ✅ John Smith - Call answered');

await updateCSVStatus(demoCSVPath, {
  phoneNumber: '+1987654321',
  voiceStatus: VOICE_STATUSES.VOICEMAIL,
  voiceNotes: 'Left voicemail message'
});
console.log('   📧 Jane Doe - Voicemail left');

await updateCSVStatus(demoCSVPath, {
  phoneNumber: '+1555123456',
  voiceStatus: VOICE_STATUSES.SCHEDULED,
  voiceNotes: 'Meeting scheduled for next week'
});
console.log('   📅 Bob Johnson - Meeting scheduled');

// Show final status
console.log('\n📊 Final Contact Status:');
const johnStatus = await getStatusFromCSV(demoCSVPath, { email: 'john@acme.com' });
if (johnStatus.found) {
  console.log(`   John Smith:`);
  console.log(`     Email: ${johnStatus.status.emailStatus} - ${johnStatus.status.emailNotes}`);
  console.log(`     Voice: ${johnStatus.status.voiceStatus} - ${johnStatus.status.voiceNotes}`);
  console.log(`     Last Updated: ${johnStatus.status.lastUpdated}`);
}

const janeStatus = await getStatusFromCSV(demoCSVPath, { email: 'jane@techco.com' });
if (janeStatus.found) {
  console.log(`   Jane Doe:`);
  console.log(`     Email: ${janeStatus.status.emailStatus} - ${janeStatus.status.emailNotes}`);
  console.log(`     Voice: ${janeStatus.status.voiceStatus} - ${janeStatus.status.voiceNotes}`);
  console.log(`     Last Updated: ${janeStatus.status.lastUpdated}`);
}

const bobStatus = await getStatusFromCSV(demoCSVPath, { email: 'bob@startup.com' });
if (bobStatus.found) {
  console.log(`   Bob Johnson:`);
  console.log(`     Email: ${bobStatus.status.emailStatus} - ${bobStatus.status.emailNotes}`);
  console.log(`     Voice: ${bobStatus.status.voiceStatus} - ${bobStatus.status.voiceNotes}`);
  console.log(`     Last Updated: ${bobStatus.status.lastUpdated}`);
}

// Show updated CSV content
console.log('\n📄 Updated CSV Content:');
console.log('─'.repeat(80));
const finalContent = fs.readFileSync(demoCSVPath, 'utf8');
console.log(finalContent);
console.log('─'.repeat(80));

// Clean up
console.log('\n🧹 Cleaning up demo files...');
if (fs.existsSync(demoCSVPath)) {
  fs.unlinkSync(demoCSVPath);
  console.log('   Demo CSV file removed');
}

console.log('\n✅ Complete System Demo Finished!');
console.log('\n🎉 Key Features Demonstrated:');
console.log('   • Voice template system with personalization');
console.log('   • CSV status tracking for email and voice campaigns');
console.log('   • Automatic timestamp tracking');
console.log('   • Contact status lookup and reporting');
console.log('   • Seamless integration between all components');