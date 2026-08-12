"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  Building2 as HospitalIcon,
  Stethoscope as DoctorIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckCircle as CheckIcon,
  ArrowLeft as ArrowLeftIcon,
  Ticket as TicketIcon,
  Sparkles as SparklesIcon,
  ChevronRight as ChevronRightIcon,
  AlertCircle as AlertCircleIcon,
} from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Doctor {
  id: string;
  hospital_id: string;
  full_name: string;
  specialization: string;
}

interface BookedAppointment {
  id: string;
  token_number: number;
  status: string;
  created_at: string;
  hospitals?: { id: string; name: string; address: string };
  doctors?: { id: string; full_name: string; specialization: string };
}

const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
];

export default function PatientBookPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Wizard Step State (1: Select Hospital, 2: Select Doctor, 3: Select Slot, 4: Confirm, 5: Token Screen)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Data Loading States
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Selection States
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(TIME_SLOTS[0]);

  // Booking Action State
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<BookedAppointment | null>(
    null
  );

  // Load active user
  useEffect(() => {
    async function loadAuth() {
      const u = await getCurrentUser();
      if (!u) {
        router.push("/login");
        return;
      }
      setCurrentUser(u);
      setAuthLoading(false);
    }
    loadAuth();
  }, [router]);

  // Load Hospitals on mount
  useEffect(() => {
    async function fetchHospitals() {
      try {
        setLoadingHospitals(true);
        const res = await fetch("/api/hospitals");
        const json = await res.json();
        if (json.hospitals) {
          setHospitals(json.hospitals);
        }
      } catch (e) {
        console.error("Failed to load hospitals", e);
      } finally {
        setLoadingHospitals(false);
      }
    }
    fetchHospitals();
  }, []);

  // Load Doctors when hospital is selected
  useEffect(() => {
    if (!selectedHospital) return;
    async function fetchDoctors() {
      try {
        setLoadingDoctors(true);
        const res = await fetch(`/api/doctors?hospitalId=${selectedHospital!.id}`);
        const json = await res.json();
        if (json.doctors) {
          setDoctors(json.doctors);
        }
      } catch (e) {
        console.error("Failed to load doctors", e);
      } finally {
        setLoadingDoctors(false);
      }
    }
    fetchDoctors();
  }, [selectedHospital]);

  const handleSelectHospital = (h: Hospital) => {
    setSelectedHospital(h);
    setSelectedDoctor(null);
    setStep(2);
  };

  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setStep(3);
  };

  const handleSelectSlot = () => {
    if (!selectedTimeSlot || !selectedDate) return;
    setStep(4);
  };

  const handleConfirmBooking = async () => {
    if (!currentUser || !selectedHospital || !selectedDoctor) return;

    setBookingInProgress(true);
    setBookingError(null);

    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentUser.id,
          doctorId: selectedDoctor.id,
          hospitalId: selectedHospital.id,
          bookingDate: selectedDate,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setBookingError(data.error || "Failed to issue token. Please try again.");
        setBookingInProgress(false);
        return;
      }

      setBookedAppointment(data.appointment);
      setStep(5); // Move to Digital Token Screen
    } catch (err: any) {
      setBookingError(err.message || "An unexpected error occurred.");
    } finally {
      setBookingInProgress(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500 animate-pulse">Initializing booking system...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/patient/dashboard" className="text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-zinc-900">
            Care<span className="text-[#E63946]">Sync</span>
          </h1>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#2A9D8F] border border-emerald-100">
            OPD Booking Wizard
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 hidden md:inline">
            Patient: <strong className="text-zinc-800">{currentUser?.fullName}</strong>
          </span>
          <Link
            href="/patient/dashboard"
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        {/* Step Progress Bar */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500">
                Step {step} of 4: {
                  step === 1 ? "Select Hospital" :
                  step === 2 ? "Select Doctor" :
                  step === 3 ? "Select Date & Time Slot" : "Confirm Booking"
                }
              </span>
              <span className="text-xs font-medium text-[#E63946]">
                {Math.round((step / 4) * 100)}% Complete
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E63946] transition-all duration-300 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* STEP 1: SELECT HOSPITAL */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-4">
              <div className="p-2.5 bg-red-50 text-[#E63946] rounded-lg">
                <HospitalIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Select Hospital</h2>
                <p className="text-xs text-zinc-500">Choose an institution to book an OPD consultation</p>
              </div>
            </div>

            {loadingHospitals ? (
              <div className="py-12 text-center text-zinc-400 text-sm animate-pulse">
                Loading Kolkata hospital network...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {hospitals.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleSelectHospital(h)}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:border-[#E63946] hover:bg-red-50/20 text-left transition-all group"
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-zinc-900 group-hover:text-[#E63946] transition-colors">
                        {h.name}
                      </h3>
                      <p className="text-xs text-zinc-500">{h.address}</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:text-[#E63946] transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SELECT DOCTOR */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 text-[#E63946] rounded-lg">
                  <DoctorIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Select Doctor</h2>
                  <p className="text-xs text-zinc-500">
                    Showing doctors at <strong className="text-zinc-700">{selectedHospital?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Change Hospital
              </button>
            </div>

            {loadingDoctors ? (
              <div className="py-12 text-center text-zinc-400 text-sm animate-pulse">
                Fetching available specialists...
              </div>
            ) : doctors.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-sm">
                No doctors found for this hospital.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {doctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDoctor(doc)}
                    className="p-4 rounded-xl border border-zinc-200 hover:border-[#E63946] hover:bg-red-50/20 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-semibold text-zinc-900 group-hover:text-[#E63946] transition-colors">
                        {doc.full_name}
                      </h4>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                        {doc.specialization}
                      </span>
                      <p className="text-xs text-zinc-400 mt-2">OPD Hours: 9:00 AM – 5:00 PM</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:text-[#E63946] shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SELECT DATE & TIME SLOT */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 text-[#E63946] rounded-lg">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Select Date & Time Slot</h2>
                  <p className="text-xs text-zinc-500">
                    Consultation with <strong className="text-zinc-700">{selectedDoctor?.full_name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Change Doctor
              </button>
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                Consultation Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#E63946]"
              />
            </div>

            {/* Time Slot Selection */}
            <div className="mb-8">
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                Available Time Slots (OPD)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                        isSelected
                          ? "bg-[#E63946] text-white border-[#E63946] shadow-sm"
                          : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSelectSlot}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-[#E63946] hover:bg-red-600 rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                Continue to Confirm
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRM BOOKING */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-6">
              <div className="p-2.5 bg-red-50 text-[#E63946] rounded-lg">
                <CheckIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Confirm Booking Summary</h2>
                <p className="text-xs text-zinc-500">Please review your appointment details before generating your token</p>
              </div>
            </div>

            {bookingError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-red-700 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-4 mb-6">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold block">Patient Name</span>
                  <p className="text-base font-bold text-zinc-900">{currentUser?.fullName}</p>
                  <p className="text-xs text-zinc-500">{currentUser?.email}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-[#2A9D8F] text-xs font-semibold rounded-md">
                  Status: Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold block mb-0.5">Hospital</span>
                  <p className="font-semibold text-zinc-800">{selectedHospital?.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{selectedHospital?.address}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold block mb-0.5">Doctor & Specialty</span>
                  <p className="font-semibold text-zinc-800">{selectedDoctor?.full_name}</p>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">{selectedDoctor?.specialization}</p>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
                <div>
                  <strong className="text-zinc-800">Date:</strong> {selectedDate}
                </div>
                <div>
                  <strong className="text-zinc-800">Time Slot:</strong> {selectedTimeSlot}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-100 pt-4">
              <button
                onClick={() => setStep(3)}
                disabled={bookingInProgress}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={bookingInProgress}
                className="px-6 py-3 text-sm font-bold text-white bg-[#E63946] hover:bg-red-600 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {bookingInProgress ? "Generating Token..." : "Confirm & Generate Token"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: DIGITAL TOKEN SCREEN (Phase 4 Completion Screen) */}
        {step === 5 && bookedAppointment && (
          <div className="space-y-6">
            {/* Digital Token Card */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden text-center">
              <div className="bg-emerald-600 text-white py-4 px-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TicketIcon className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Official Digital Token</span>
                </div>
                <p className="text-xs text-emerald-100">CareSync OPD Reservation System</p>
              </div>

              <div className="p-8">
                {/* Large Token Badge */}
                <div className="my-4 inline-block px-8 py-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest block mb-1">
                    Your Token Number
                  </span>
                  <span className="text-6xl font-black text-emerald-800 tracking-tight">
                    #{String(bookedAppointment.token_number).padStart(2, "0")}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-6 max-w-md mx-auto space-y-3 text-sm text-left bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500 text-xs">Patient</span>
                    <strong className="text-zinc-900">{currentUser?.fullName}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500 text-xs">Doctor</span>
                    <strong className="text-zinc-900">
                      {bookedAppointment.doctors?.full_name || selectedDoctor?.full_name}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500 text-xs">Specialization</span>
                    <span className="text-emerald-700 font-medium text-xs">
                      {bookedAppointment.doctors?.specialization || selectedDoctor?.specialization}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500 text-xs">Hospital</span>
                    <strong className="text-zinc-900 text-right">
                      {bookedAppointment.hospitals?.name || selectedHospital?.name}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 text-xs">Appointment Slot</span>
                    <strong className="text-zinc-900">{selectedDate} ({selectedTimeSlot})</strong>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/patient/dashboard"
                    className="px-6 py-3 text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors text-center"
                  >
                    Return to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setStep(1);
                      setSelectedHospital(null);
                      setSelectedDoctor(null);
                      setBookedAppointment(null);
                    }}
                    className="px-6 py-3 text-sm font-bold text-white bg-[#E63946] hover:bg-red-600 rounded-xl transition-colors shadow-sm text-center"
                  >
                    Book Another OPD Slot
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
