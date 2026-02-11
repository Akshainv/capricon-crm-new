export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: string;
  status: 'Seeded Lead' | 'Meeting Fixed' | 'Meeting Completed' | 'CS Executed';
  assignedTo: string;
  createdAt: Date;
}