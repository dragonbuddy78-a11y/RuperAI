import { Header } from "@/components/layout/header";
import { ContentCalendar } from "@/components/calendar/content-calendar";

export default function CalendarPage() {
  return (
    <>
      <Header
        title="Content Calendar"
        description="Plan, schedule, and track your repurposed content"
      />
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-6xl">
          <ContentCalendar />
        </div>
      </div>
    </>
  );
}