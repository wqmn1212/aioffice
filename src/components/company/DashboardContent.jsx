import React from 'react';
import CalendarView from '@/components/company/CalendarView';
import AgentLogFeed from '@/components/company/AgentLogFeed';

export default function DashboardContent({ tasks, goals, logs, onTask, isDemo }) {
  return <div className="dashboard-workspace"><CalendarView tasks={tasks} goals={goals} onTask={onTask}/><AgentLogFeed logs={logs} tasks={tasks} onTask={onTask} isDemo={isDemo}/></div>;
}