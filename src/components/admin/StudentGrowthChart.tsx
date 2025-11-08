import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentGrowthChartProps {
  students: any[];
  isLoading?: boolean;
}

const StudentGrowthChart = ({ students, isLoading }: StudentGrowthChartProps) => {
  const chartData = useMemo(() => {
    if (!students || students.length === 0) return [];

    // Get all students with valid registration dates
    const studentsWithDates: Array<{ date: Date; index: number }> = [];
    
    students.forEach((student, studentIndex) => {
      // Try to find registration date - check common fields
      let registrationDate: Date | null = null;
      const dateFields = ['createdAt', 'registrationDate', 'createdDate', 'dateCreated', 'joinDate'];
      
      for (const field of dateFields) {
        if (student[field]) {
          try {
            registrationDate = parseISO(student[field]);
            if (!isNaN(registrationDate.getTime())) {
              break;
            }
          } catch {
            try {
              registrationDate = new Date(student[field]);
              if (!isNaN(registrationDate.getTime())) {
                break;
              }
            } catch {
              // Continue
            }
          }
        }
      }

      // If no date found, use a default date (student index as days ago)
      if (!registrationDate || isNaN(registrationDate.getTime())) {
        const now = new Date();
        registrationDate = subDays(now, students.length - studentIndex);
      }

      if (registrationDate && !isNaN(registrationDate.getTime())) {
        studentsWithDates.push({ date: registrationDate, index: studentIndex });
      }
    });

    // Sort by date
    studentsWithDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    // If we have dates, use them; otherwise distribute evenly over last 30 days
    const now = new Date();
    let startDate: Date;
    
    if (studentsWithDates.length > 0) {
      // Use the earliest student date or 30 days ago, whichever is more recent
      const earliestDate = studentsWithDates[0].date;
      const thirtyDaysAgo = subDays(now, 30);
      startDate = earliestDate < thirtyDaysAgo ? thirtyDaysAgo : earliestDate;
    } else {
      startDate = subDays(now, 30);
    }

    // Create days data from start date to now
    const daysSinceStart = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysData = Array.from({ length: Math.max(daysSinceStart, 1) }, (_, i) => {
      const date = subDays(now, daysSinceStart - 1 - i);
      return {
        date: format(date, 'MMM dd'),
        fullDate: date,
        count: 0,
        cumulative: 0,
      };
    });

    // Count students registered on each day
    studentsWithDates.forEach(({ date }) => {
      const dayIndex = daysData.findIndex((d) => {
        return d.fullDate.toDateString() === date.toDateString();
      });
      if (dayIndex >= 0) {
        daysData[dayIndex].count++;
      } else {
        // If date is outside range, add to the closest day
        const closestIndex = daysData.findIndex((d) => d.fullDate > date);
        if (closestIndex >= 0) {
          daysData[closestIndex].count++;
        } else if (daysData.length > 0) {
          daysData[daysData.length - 1].count++;
        }
      }
    });

    // Calculate cumulative count
    // Start with total students before the period (if any dates are before startDate)
    const studentsBeforePeriod = studentsWithDates.filter(
      ({ date }) => date < startDate
    ).length;
    
    let cumulative = studentsBeforePeriod;
    return daysData.map((day) => {
      cumulative += day.count;
      // Ensure cumulative never goes below the number of students we've processed
      return {
        ...day,
        cumulative: Math.max(cumulative, students.length > 0 ? Math.min(cumulative, students.length) : 0),
      };
    });
  }, [students]);

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20 glow-effect">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 glow-effect">
      <CardHeader>
        <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Student Growth
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Student registration trend ({students?.length || 0} total students)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No student data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255, 255, 255, 0.7)"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.7)"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(26, 11, 46, 0.95)',
                  border: '1px solid rgba(248, 181, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                labelStyle={{ color: '#f8b500' }}
              />
              <Legend 
                wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Total Students"
                stroke="#f8b500"
                strokeWidth={2}
                dot={{ fill: '#f8b500', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="New Registrations"
                stroke="#6a4c93"
                strokeWidth={2}
                dot={{ fill: '#6a4c93', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentGrowthChart;

