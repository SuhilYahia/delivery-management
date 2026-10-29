import { describe, it, expect } from 'vitest';
import { calculateTripCost } from '../src/utils/pricingCalculator.js';

describe('خوارزمية التسعير وحساب تكلفة المشاوير (Pricing Engine)', () => {
  it('يجب أن تحتسب 20 ريالاً للمدد من 1 إلى 19 دقيقة', () => {
    expect(calculateTripCost(1)).toBe(20);
    expect(calculateTripCost(10)).toBe(20);
    expect(calculateTripCost(19)).toBe(20);
  });

  it('يجب أن تحتسب 30 ريالاً للمدد من 20 إلى 29 دقيقة (أقل من 30 دقيقة)', () => {
    expect(calculateTripCost(20)).toBe(30);
    expect(calculateTripCost(25)).toBe(30);
    expect(calculateTripCost(29)).toBe(30);
  });

  it('يجب أن تحتسب 50 ريالاً للمدد من 30 إلى 60 دقيقة شاملة', () => {
    expect(calculateTripCost(30)).toBe(50);
    expect(calculateTripCost(45)).toBe(50);
    expect(calculateTripCost(60)).toBe(50);
  });

  it('يجب أن تضيف 50 ريالاً لكل ساعة إضافية أو جزء منها بعد 60 دقيقة', () => {
    // 61 دقيقة: 50 أساسي + (1 ساعة إضافية * 50) = 100 ريال
    expect(calculateTripCost(61)).toBe(100);
    // 90 دقيقة: 50 أساسي + (1 ساعة إضافية * 50) = 100 ريال
    expect(calculateTripCost(90)).toBe(100);
    // 120 دقيقة (ساعتان): 50 أساسي + (1 ساعة إضافية * 50) = 100 ريال
    expect(calculateTripCost(120)).toBe(100);
    // 121 دقيقة: 50 أساسي + (2 ساعة إضافية * 50) = 150 ريال
    expect(calculateTripCost(121)).toBe(150);
    // 180 دقيقة: 50 أساسي + (2 ساعة إضافية * 50) = 150 ريال
    expect(calculateTripCost(180)).toBe(150);
    // 181 دقيقة: 50 أساسي + (3 ساعات إضافية * 50) = 200 ريال
    expect(calculateTripCost(181)).toBe(200);
  });

  it('يجب أن ترفض المدد الصفرية أو السالبة برمي استثناء واضح', () => {
    expect(() => calculateTripCost(0)).toThrow('مدة المشوار يجب أن تكون رقماً صحيحاً موجباً أكبر من صفر');
    expect(() => calculateTripCost(-5)).toThrow('مدة المشوار يجب أن تكون رقماً صحيحاً موجباً أكبر من صفر');
  });

  it('يجب أن تدعم قواعد التسعير المخصصة لكل شركة', () => {
    const customConfig = {
      tier1MaxMinutes: 15,
      tier1Price: 25,
      tier2MaxMinutes: 30,
      tier2Price: 35,
      tier3MaxMinutes: 60,
      tier3Price: 60,
      extraHourRate: 60,
    };
    // 10 دقائق بالشريحة الأولى المخصصة
    expect(calculateTripCost(10, customConfig)).toBe(25);
    // 25 دقيقة بالشريحة الثانية المخصصة
    expect(calculateTripCost(25, customConfig)).toBe(35);
    // 40 دقيقة بالشريحة الثالثة المخصصة
    expect(calculateTripCost(40, customConfig)).toBe(60);
    // 70 دقيقة: 60 + 1*60 = 120 ريال
    expect(calculateTripCost(70, customConfig)).toBe(120);
  });
});
