// src/app/features/communication/sales-calendar/sales-calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: 'call' | 'email' | 'meeting' | 'site-visit' | 'follow-up' | 'task';
  priority: 'high' | 'medium' | 'low';
  status: 'scheduled' | 'completed' | 'cancelled';
  leadId?: string;
  leadName?: string;
  location?: string;
  allDay?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-sales-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sales-calender.component.html',
  styleUrls: ['./sales-calender.component.css']
})
export class SalesCalendarComponent implements OnInit {
  eventForm!: FormGroup;
  showAddForm: boolean = false;
  showEventDetails: boolean = false;
  selectedEvent: CalendarEvent | null = null;
  selectedDate: Date | null = null;

  currentDate: Date = new Date();
  viewMode: 'month' | 'week' | 'day' = 'month';
  
  calendarDays: CalendarDay[] = [];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];

  events: CalendarEvent[] = [];

  eventTypes = [
    { value: 'call', label: 'Phone Call', icon: 'fa-phone', color: '#60a5fa' },
    { value: 'email', label: 'Email', icon: 'fa-envelope', color: '#c084fc' },
    { value: 'meeting', label: 'Meeting', icon: 'fa-users', color: '#fb923c' },
    { value: 'site-visit', label: 'Site Visit', icon: 'fa-map-marker-alt', color: '#4ade80' },
    { value: 'follow-up', label: 'Follow-up', icon: 'fa-phone-volume', color: '#60a5fa' },
    { value: 'task', label: 'Task', icon: 'fa-tasks', color: '#d4b347' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMockEvents();
    this.generateCalendar();
  }

  loadMockEvents(): void {
    const today = new Date();
    
    this.events = [
      {
        id: '1',
        title: 'Client Meeting - ABC Corp',
        description: 'Discuss elevator specifications and pricing',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0),
        type: 'meeting',
        priority: 'high',
        status: 'scheduled',
        leadId: 'LD-2024-001',
        leadName: 'ABC Corporation - John Smith',
        location: 'Client Office'
      },
      {
        id: '2',
        title: 'Site Visit - XYZ Developers',
        description: 'Conduct site survey and measurements',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 16, 0),
        type: 'site-visit',
        priority: 'high',
        status: 'scheduled',
        leadId: 'LD-2024-002',
        leadName: 'XYZ Developers - Sarah Johnson',
        location: 'Construction Site, Mumbai'
      },
      {
        id: '3',
        title: 'Follow-up Call',
        description: 'Discuss quotation and answer questions',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30),
        type: 'call',
        priority: 'medium',
        status: 'scheduled',
        leadId: 'LD-2024-003',
        leadName: 'Tech Park Ltd - Michael Brown'
      },
      {
        id: '4',
        title: 'Send Quotation Email',
        description: 'Send revised quotation to customer',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 11, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 11, 30),
        type: 'email',
        priority: 'medium',
        status: 'scheduled',
        leadId: 'LD-2024-004',
        leadName: 'Green Heights - Emily Davis'
      },
      {
        id: '5',
        title: 'Product Demo',
        description: 'Showcase elevator features at showroom',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 10, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 12, 0),
        type: 'meeting',
        priority: 'high',
        status: 'scheduled',
        leadId: 'LD-2024-005',
        leadName: 'Metro Mall - David Wilson',
        location: 'Showroom'
      },
      {
        id: '6',
        title: 'Task: Prepare Proposal',
        description: 'Create detailed installation proposal',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0),
        type: 'task',
        priority: 'high',
        status: 'scheduled'
      },
      {
        id: '7',
        title: 'Client Call - Budget Discussion',
        description: 'Discuss pricing options',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 14, 0),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 15, 0),
        type: 'call',
        priority: 'medium',
        status: 'scheduled',
        leadId: 'LD-2024-006',
        leadName: 'Star Apartments'
      }
    ];
  }

  initForm(): void {
    const now = new Date();
    const today = this.formatDateForInput(now);
    const currentTime = this.formatTimeForInput(now);
    const oneHourLater = this.formatTimeForInput(new Date(now.getTime() + 60 * 60 * 1000));

    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      type: ['meeting', Validators.required],
      priority: ['medium', Validators.required],
      startDate: [today, Validators.required],
      startTime: [currentTime, Validators.required],
      endDate: [today, Validators.required],
      endTime: [oneHourLater, Validators.required],
      location: [''],
      allDay: [false],
      leadId: [''],
      leadName: ['']
    });

    // Auto-update end date when start date changes
    this.eventForm.get('startDate')?.valueChanges.subscribe(startDate => {
      if (startDate && !this.eventForm.get('endDate')?.value) {
        this.eventForm.patchValue({ endDate: startDate });
      }
    });
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  generateCalendar(): void {
    if (this.viewMode === 'month') {
      this.generateMonthView();
    } else if (this.viewMode === 'week') {
      this.generateWeekView();
    } else {
      this.generateDayView();
    }
  }

  generateMonthView(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = this.getEventsForDate(date);

      this.calendarDays.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: this.isSameDay(date, today),
        events: dayEvents
      });
    }
  }

  generateWeekView(): void {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
    
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayEvents = this.getEventsForDate(date);

      this.calendarDays.push({
        date: new Date(date),
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        events: dayEvents
      });
    }
  }

  generateDayView(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayEvents = this.getEventsForDate(this.currentDate);

    this.calendarDays = [{
      date: new Date(this.currentDate),
      isCurrentMonth: true,
      isToday: this.isSameDay(this.currentDate, today),
      events: dayEvents
    }];
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    return this.events.filter(event => {
      return this.isSameDay(new Date(event.startDate), date);
    });
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  changeView(mode: 'month' | 'week' | 'day'): void {
    this.viewMode = mode;
    this.generateCalendar();
  }

  previousPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    } else if (this.viewMode === 'week') {
      const newDate = new Date(this.currentDate);
      newDate.setDate(newDate.getDate() - 7);
      this.currentDate = newDate;
    } else {
      const newDate = new Date(this.currentDate);
      newDate.setDate(newDate.getDate() - 1);
      this.currentDate = newDate;
    }
    this.generateCalendar();
  }

  nextPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    } else if (this.viewMode === 'week') {
      const newDate = new Date(this.currentDate);
      newDate.setDate(newDate.getDate() + 7);
      this.currentDate = newDate;
    } else {
      const newDate = new Date(this.currentDate);
      newDate.setDate(newDate.getDate() + 1);
      this.currentDate = newDate;
    }
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
  }

  getCurrentPeriodLabel(): string {
    if (this.viewMode === 'month') {
      return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    } else if (this.viewMode === 'week') {
      const startOfWeek = new Date(this.currentDate);
      startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return this.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }

  toggleAddForm(date?: Date): void {
    this.showAddForm = !this.showAddForm;
    
    if (this.showAddForm) {
      if (date) {
        this.selectedDate = date;
        const dateStr = this.formatDateForInput(date);
        this.eventForm.patchValue({
          startDate: dateStr,
          endDate: dateStr
        });
      }
    } else {
      this.selectedDate = null;
      this.resetForm();
    }
  }

  resetForm(): void {
    const now = new Date();
    const today = this.formatDateForInput(now);
    const currentTime = this.formatTimeForInput(now);
    const oneHourLater = this.formatTimeForInput(new Date(now.getTime() + 60 * 60 * 1000));

    this.eventForm.reset({
      type: 'meeting',
      priority: 'medium',
      allDay: false,
      startDate: today,
      startTime: currentTime,
      endDate: today,
      endTime: oneHourLater
    });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      const formData = this.eventForm.value;
      
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (!formData.allDay && formData.startTime && formData.endTime) {
        const [startHours, startMinutes] = formData.startTime.split(':');
        const [endHours, endMinutes] = formData.endTime.split(':');
        startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
        endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
      } else {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      // Validate end date is after start date
      if (endDate < startDate) {
        alert('End date/time must be after start date/time');
        return;
      }

      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description || '',
        startDate: startDate,
        endDate: endDate,
        type: formData.type,
        priority: formData.priority,
        status: 'scheduled',
        location: formData.location || undefined,
        leadId: formData.leadId || undefined,
        leadName: formData.leadName || undefined,
        allDay: formData.allDay
      };

      this.events.push(newEvent);
      this.events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      this.generateCalendar();
      this.toggleAddForm();
      
      alert('Event added successfully!');
    } else {
      alert('Please fill in all required fields');
    }
  }

  viewEventDetails(event: CalendarEvent): void {
    this.selectedEvent = event;
    this.showEventDetails = true;
  }

  closeEventDetails(): void {
    this.showEventDetails = false;
    this.selectedEvent = null;
  }

  deleteEvent(eventId: string): void {
    if (confirm('Are you sure you want to delete this event?')) {
      this.events = this.events.filter(e => e.id !== eventId);
      this.generateCalendar();
      this.closeEventDetails();
    }
  }

  markAsCompleted(eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.status = 'completed';
      this.generateCalendar();
      alert('Event marked as completed!');
    }
  }

  getEventTypeInfo(type: string) {
    return this.eventTypes.find(t => t.value === type) || this.eventTypes[0];
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatTimeRange(start: Date, end: Date): string {
    return `${this.formatTime(start)} - ${this.formatTime(end)}`;
  }

  viewLead(leadId: string): void {
    this.closeEventDetails();
    this.router.navigate(['/leads', leadId]);
  }

  getDayEvents(day: CalendarDay): CalendarEvent[] {
    return day.events
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 3); // Show only first 3 events in month view
  }

  getHourlyEvents(): { hour: number; events: CalendarEvent[] }[] {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hourEvents = this.calendarDays[0]?.events.filter(event => {
        return new Date(event.startDate).getHours() === i;
      }) || [];
      hours.push({ hour: i, events: hourEvents });
    }
    return hours;
  }

  onDayClick(day: CalendarDay): void {
    if (this.viewMode === 'month') {
      this.currentDate = new Date(day.date);
      this.changeView('day');
    }
  }

  hasMoreEvents(day: CalendarDay): boolean {
    return day.events.length > 3;
  }

  getMoreEventsCount(day: CalendarDay): number {
    return day.events.length - 3;
  }
}