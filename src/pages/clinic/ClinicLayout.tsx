import React from "react";
import { Outlet, Link, useParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

export default function ClinicLayout() {
  const { slug } = useParams();

  return (
    <PageLayout>
      <PageLayout.Header>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Clinic: {slug}</h2>
            <nav className="flex gap-2">
              <Link to="staff" className="text-sm text-primary">Staff</Link>
              <Link to="patients" className="text-sm text-primary">Patients</Link>
              <Link to="subscription" className="text-sm text-primary">Subscription</Link>
            </nav>
          </div>
          <div>
            <Button asChild>
              <a href={`/clinic/${slug}/patients/new`}>New Patient</a>
            </Button>
          </div>
        </div>
      </PageLayout.Header>

      <PageLayout.Content>
        <Outlet />
      </PageLayout.Content>
    </PageLayout>
  );
}
