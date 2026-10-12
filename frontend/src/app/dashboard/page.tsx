'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { ShipmentFilters } from '@/components/dashboard/ShipmentFilters';
import { ShipmentResults } from '@/components/dashboard/ShipmentResults';
import { ShipmentModal } from '@/components/dashboard/ShipmentModal';
import {
  INITIAL_ORIGIN_SUMMARIES,
  SAMPLE_SHIPMENTS,
  OriginSummary,
  ShipmentItem,
} from '@/lib/dashboard/mock-data';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Navigation & Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [selectedOrigin, setSelectedOrigin] = useState('all');

  // Preview Toggle: switches between Empty State (default) and Sample Mock Data
  const [isMockDataActive, setIsMockDataActive] = useState(false);

  // Route protection: redirect to /login if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Active shipments pool based on mock toggle
  const baseShipments: ShipmentItem[] = useMemo(() => {
    return isMockDataActive ? SAMPLE_SHIPMENTS : [];
  }, [isMockDataActive]);

  // Compute Origin Summary Cards
  const originSummaries: OriginSummary[] = useMemo(() => {
    if (!isMockDataActive) {
      return INITIAL_ORIGIN_SUMMARIES.map((s) => ({
        ...s,
        isHighlighted: s.id === selectedOrigin,
      }));
    }

    const calcOrigin = (id: string, name: string) => {
      const items =
        id === 'all'
          ? SAMPLE_SHIPMENTS
          : SAMPLE_SHIPMENTS.filter((s) => s.origin.toLowerCase() === name.toLowerCase());
      return {
        id,
        title: id === 'all' ? 'All Origins' : name,
        shipmentCount: items.length,
        totalWeightKg: items.reduce((acc, c) => acc + c.weightKg, 0),
        totalVolumeCbm: items.reduce((acc, c) => acc + c.volumeCbm, 0),
        isHighlighted: id === selectedOrigin,
      };
    };

    return [
      calcOrigin('all', 'All Origins'),
      calcOrigin('usa', 'USA'),
      calcOrigin('uk', 'UK'),
      calcOrigin('germany', 'Germany'),
      calcOrigin('walmart_us', 'Walmart US'),
    ];
  }, [isMockDataActive, selectedOrigin]);

  // Filtered shipments according to current search, status, and selected origin
  const filteredShipments = useMemo(() => {
    return baseShipments.filter((shipment) => {
      // 1. Origin filter
      if (selectedOrigin !== 'all') {
        const originMap: Record<string, string> = {
          usa: 'usa',
          uk: 'uk',
          germany: 'germany',
          walmart_us: 'walmart us',
        };
        const targetOrigin = originMap[selectedOrigin];
        if (targetOrigin && shipment.origin.toLowerCase() !== targetOrigin) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'All Statuses' && shipment.status !== statusFilter) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesInvoice = shipment.invoiceNo.toLowerCase().includes(query);
        const matchesFba = shipment.fbaId.toLowerCase().includes(query);
        const matchesManager = shipment.manager.toLowerCase().includes(query);
        if (!matchesInvoice && !matchesFba && !matchesManager) {
          return false;
        }
      }

      return true;
    });
  }, [baseShipments, selectedOrigin, statusFilter, searchQuery]);

  // Handlers
  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
  };

  const handleToggleMockData = () => {
    setIsMockDataActive((prev) => !prev);
  };

  const handleSelectOrigin = (originId: string) => {
    setSelectedOrigin(originId);
  };

  const handleExportCsv = () => {
    alert('Export CSV functionality will be connected to live data in a future phase.');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1020] flex relative">
      {/* Top subtle verification bar while verifying session */}
      {isLoading && (
        <div className="absolute top-0 inset-x-0 h-1 bg-indigo-100 overflow-hidden z-50">
          <div className="h-full bg-[#503BFF] animate-pulse w-full"></div>
        </div>
      )}
      {/* 1. Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenCreateModal={handleOpenCreateModal}
        activeItem="dashboard"
        shipmentCount={baseShipments.length}
        watchlistCount={0}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* A. Main Dashboard Header */}
          <DashboardHeader
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onExportCsv={handleExportCsv}
          />

          {/* B. Five Summary Cards Grid */}
          <section
            aria-label="Shipment Origin Summaries"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4"
          >
            {originSummaries.map((summary) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                isSelected={selectedOrigin === summary.id}
                onSelect={() => handleSelectOrigin(summary.id)}
              />
            ))}
          </section>

          {/* C. Search & Filter Controls */}
          <section aria-label="Shipment Filters">
            <ShipmentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              isMockDataActive={isMockDataActive}
              onToggleMockData={handleToggleMockData}
            />
          </section>

          {/* D. Shipment Results Area (Empty State vs Horizontally Scrollable Table) */}
          <section aria-label="Shipment Results">
            <ShipmentResults
              shipments={filteredShipments}
              onOpenAddShipment={handleOpenCreateModal}
            />
          </section>
        </main>
      </div>

      {/* 3. Shipment Creation Modal Shell */}
      <ShipmentModal
        isOpen={isModalOpen}
        onClose={handleCloseCreateModal}
      />
    </div>
  );
}
