export const SUBJECTS = [
  { id: 'arabic', name: 'عربي', plan: 2, prep: 3 },
  { id: 'religion', name: 'دين', plan: 2, prep: 2.5 },
  { id: 'science', name: 'علوم', plan: 2, prep: 2.5 },
  { id: 'biology', name: 'العلوم الحياتية', plan: 1.5, prep: 2.5 },
  { id: 'chemistry', name: 'الكيمياء', plan: 1.5, prep: 2.5 },
  { id: 'physics', name: 'الفيزياء', plan: 1.5, prep: 2.5 },
  { id: 'earth', name: 'علوم الأرض', plan: 1.5, prep: 2.5 },
  { id: 'math_student', name: 'رياضيات كتاب الطالب', plan: 2, prep: 3 },
  { id: 'math_business', name: 'رياضيات الأعمال', plan: 2, prep: 3 },
  { id: 'english', name: 'انجليزي', plan: 2, prep: 3 },
  { id: 'social', name: 'دراسات اجتماعية', plan: 2, prep: 2.5 },
  { id: 'national', name: 'تربية وطنية', plan: 1, prep: 1.5 },
  { id: 'history', name: 'تاريخ', plan: 1, prep: 1.5 },
  { id: 'geo', name: 'جغرافيا', plan: 1, prep: 1.5 },
  { id: 'digital', name: 'مهارات رقمية', plan: 2, prep: 2.5 },
  { id: 'finance', name: 'ثقافة مالية', plan: 2, prep: 2.5 },
  { id: 'art', name: 'تربية فنية', plan: 2, prep: 2.5 },
  { id: 'vocational', name: 'تربية مهنية', plan: 2, prep: 2.5 },
  { id: 'psych', name: 'علم النفس والاجتماع (ثاني عشر)', plan: 2, prep: 2.5 },
  { id: 'philosophy', name: 'الفلسفة (ثاني عشر)', plan: 2, prep: 2.5 },
];

export const GRADES = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 
  'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'
];

export enum DeliveryType {
  Pickup = 0,
  Delivery = 1
}

export enum OrderStatus {
  Pending = 0,
  Processing = 1,
  Delivered = 2,
  Cancelled = 3
}

export enum ServiceType {
  Plan = 0, // خطة فصلية
  Prep = 1  // تحضير يومي
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  teacher_name: string;
  subject: string;
  grade: string;
  service_type: ServiceType;
  price: number;
  quantity?: number;
}

export interface Order {
  id?: number;
  created_at?: string;
  customer_name: string;
  school_name: string;
  directorate: string;
  governorate: string;
  district: string;
  phone: string;
  delivery_type: DeliveryType;
  delivery_cost?: number;
  total_amount: number;
  status?: OrderStatus;
  delivery_person?: string;
  colleague_notes?: string;
}
