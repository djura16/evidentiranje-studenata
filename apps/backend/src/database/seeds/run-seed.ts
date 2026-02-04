import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { seedDatabase } from './seed';
import { User } from '../../auth/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { ClassSession } from '../../classes/entities/class-session.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';

// Učitaj .env fajl iz backend direktorijuma
config({ path: resolve(__dirname, '../../../.env') });

async function runSeed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USER || 'evident_user',
    password: process.env.DB_PASSWORD || 'evident_pass',
    database: process.env.DB_NAME || 'evidentiranje',
    entities: [User, Subject, ClassSession, Attendance],
    synchronize: true, // Kreira tabele ako ne postoje
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');
    console.log('Creating tables if they don\'t exist...');
    await seedDatabase(dataSource);
    await dataSource.destroy();
    console.log('Seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Error running seed:', error);
    process.exit(1);
  }
}

runSeed();
