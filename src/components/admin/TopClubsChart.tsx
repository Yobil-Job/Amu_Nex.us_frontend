import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Building2, Award } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TopClubsChartProps {
  clubs: any[];
  events: any[];
  isLoading?: boolean;
}

const COLORS = ['#f8b500', '#6a4c93', '#c06c84', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181', '#aa96da'];

const TopClubsChart = ({ clubs, events, isLoading }: TopClubsChartProps) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const topClubsData = useMemo(() => {
    if (!clubs || clubs.length === 0 || !events || events.length === 0) return [];

    // Count events per club
    const clubEventCounts: Record<number, { name: string; count: number; clubId: number }> = {};
    
    events.forEach((event) => {
      const clubId = event.club?.id;
      if (clubId) {
        if (!clubEventCounts[clubId]) {
          const club = clubs.find(c => c.id === clubId);
          clubEventCounts[clubId] = {
            name: club?.title || club?.name || `Club ${clubId}`,
            count: 0,
            clubId,
          };
        }
        clubEventCounts[clubId].count++;
      }
    });

    // Sort by event count and take top 8
    return Object.values(clubEventCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((club, index) => ({
        ...club,
        value: club.count,
        color: COLORS[index % COLORS.length],
      }));
  }, [clubs, events]);

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
          <Award className="h-5 w-5 text-accent" />
          Top Active Clubs
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Clubs ranked by event activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topClubsData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No club activity data available</p>
            </div>
          </div>
        ) : (
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'pie' | 'bar')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="pie" className="mt-0">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topClubsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#f8b500"
                    dataKey="value"
                  >
                    {topClubsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(26, 11, 46, 0.95)',
                      border: '1px solid rgba(248, 181, 0, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="bar" className="mt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topClubsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255, 255, 255, 0.7)"
                    tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
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
                  />
                  <Bar dataKey="value" fill="#f8b500" radius={[8, 8, 0, 0]}>
                    {topClubsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default TopClubsChart;

