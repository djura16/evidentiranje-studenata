import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../auth/entities/user.entity';
import { UserRole } from '@evidentiranje/shared';

export async function seedDatabase(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (existingAdmin) {
    console.log('Seed data already exists. Skipping...');
    return;
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('password123', salt);

  // Create Admin
  const admin = userRepository.create({
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    password: hashedPassword,
    role: UserRole.ADMIN,
  });

  // Create Teacher
  const teacher = userRepository.create({
    email: 'profesor@example.com',
    firstName: 'Marko',
    lastName: 'Profesor',
    password: hashedPassword,
    role: UserRole.TEACHER,
  });

  // Create Student
  const student = userRepository.create({
    email: 'student@example.com',
    firstName: 'Jovan',
    lastName: 'Student',
    indexNumber: '001',
    enrollmentYear: 2020,
    password: hashedPassword,
    role: UserRole.STUDENT,
  });

  await userRepository.save([admin, teacher, student]);

  console.log('Seed data created successfully!');
  console.log('Admin: admin@example.com / password123');
  console.log('Teacher: profesor@example.com / password123');
  console.log('Student: student@example.com / password123');
}
