'use client';

import { Star, Users, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';



interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  level: string;
  price: number;
  rating: number;
  enrollCount: number;
  totalDuration?: number;
  teacher?: { user: { firstName: string; lastName: string; avatarUrl?: string } };
}

interface CourseCardProps {
  course: Course;
}

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-blue-100 text-blue-700',
  ADVANCED: 'bg-orange-100 text-orange-700',
  EXPERT: 'bg-red-100 text-red-700',
};

export function CourseCard({ course }: CourseCardProps) {
  const durationH = Math.floor((course.totalDuration ?? 0) / 3600);
  const durationM = Math.floor(((course.totalDuration ?? 0) % 3600) / 60);

  return (
    <Link href={`/courses/${course.id}`} className="group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200">
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
          {course.thumbnailUrl && (
            <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
          )}
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${LEVEL_COLORS[course.level] ?? 'bg-gray-100 text-gray-700'}`}>
              {course.level}
            </span>
          </div>
          {course.price === 0 && (
            <div className="absolute top-3 right-3">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white text-green-700">Free</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {course.category && (
            <p className="text-xs text-blue-600 font-medium mb-1">{course.category}</p>
          )}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>

          {course.teacher && (
            <p className="text-xs text-gray-500 mt-2">
              {course.teacher.user.firstName} {course.teacher.user.lastName}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {course.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.enrollCount.toLocaleString()}
            </span>
            {(durationH > 0 || durationM > 0) && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {durationH > 0 ? `${durationH}h` : ''} {durationM > 0 ? `${durationM}m` : ''}
              </span>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="font-bold text-gray-900">
              {course.price === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
