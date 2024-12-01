"use client";
import { useState, useEffect } from "react";
import {
	Calendar as CalendarIcon,
	User,
	FileText,
	LogOut,
	Link,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "../../context/authcontext";
import { useRouter } from "next/navigation";

export default function Component() {
	const router = useRouter();
	const { user, logout } = useAuth();
	const [currentDate, setCurrentDate] = useState("");
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [attendance, setAttendance] = useState({});
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [prayerTimes, setPrayerTimes] = useState([]);
	const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
	const [reportLink, setReportLink] = useState("");
	const [loading, setLoading] = useState(false);
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);
	const baseUrl = process.env.NEXT_PUBLIC_AWS_API_GATEWAY_BASE_DEV_URL;

	const fullName = user ? user.name : "Guest";
	const emailAddress = user ? user.email : "user@example.com";

	useEffect(() => {
		const fetchPrayerTimes = async () => {
			if (user) {
				const latitudeVal = user["custom:latitude"];
				const longitudeVal = user["custom:longitude"];
				try {
					const response = await fetch(
						`https://api.aladhan.com/v1/timings?latitude=${latitudeVal}&longitude=${longitudeVal}`
					);
					const result = await response.json();
					const timings = result.data.timings;

					const fetchedPrayerTimes = [
						{ name: "Fajr", time: timings.Fajr },
						{ name: "Dhuhr", time: timings.Dhuhr },
						{ name: "Asr", time: timings.Asr },
						{ name: "Maghrib", time: timings.Maghrib },
						{ name: "Isha", time: timings.Isha },
					];
					setPrayerTimes(fetchedPrayerTimes);
					const options = { day: "2-digit", month: "long", year: "numeric" };

					let unformattedDate = new Date(result.data.date.timestamp * 1000);

					setCurrentDate(
						unformattedDate
							.toLocaleDateString("en-CA", options)
							.replace(",", "")
					);
				} catch (error) {
					console.error("Error fetching prayer times:", error);
				}
			}
		};

		fetchPrayerTimes();
	}, [user]);

	useEffect(() => {
		const fetchAttendanceRecord = async () => {
			if (user) {
				try {
					const response = await fetch(baseUrl + "/checkAttendance", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							email: user.email,
							date: selectedDate.toISOString().split("T")[0],
						}),
					});

					if (!response.ok) {
						throw new Error("Failed to fetch attendance record");
					}

					const responseText = await response.text();
					const data = JSON.parse(responseText);
					const returnData = JSON.parse(data.body);
					const newAttendance = {};

					if (returnData.data && returnData.data.PrayerTimes) {
						console.log(returnData.data.PrayerTimes);

						for (const prayerName of Object.keys(returnData.data.PrayerTimes)) {
							if (returnData.data.PrayerTimes[prayerName] === true) {
								newAttendance[prayerName] = true;
							}
						}
					} else {
						console.warn("No PrayerTimes data found in the response");
					}

					console.log("Final Attendance State:", newAttendance);
					setAttendance(newAttendance);
				} catch (error) {
					console.error("Error fetching attendance record:", error);
					const allFalseAttendance = Object.fromEntries(
						prayerTimes.map((prayer) => [prayer.name, false])
					);
					setAttendance(allFalseAttendance);
				}
			}
		};

		fetchAttendanceRecord();
	}, [selectedDate, user, prayerTimes]);

	const handleAttendanceChange = (prayerName) => {
		setAttendance((prev) => ({ ...prev, [prayerName]: !prev[prayerName] }));
	};

	const handleSave = async () => {
		try {
			const attendanceObject = {
				email: user.email,
				date: selectedDate.toISOString().split("T")[0],
				prayerTimes: attendance,
			};

			console.log(attendanceObject);

			const createResponse = await fetch(baseUrl + "/attendanceEndpoint", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(attendanceObject),
			});

			console.log(createResponse);

			if (!createResponse.ok) {
				throw new Error("Failed to create attendance data");
			}

			console.log("Attendance created:", attendanceObject);

			setIsDialogOpen(false);
		} catch (error) {
			console.error("Error saving attendance:", error);
		}
	};

	const handleReport = async () => {
		try {
			setLoading(true);
			setIsGeneratingReport(true);
			setIsReportDialogOpen(true);
			const payload = {
				email: user.email,
			};
			const generateReport = await fetch(baseUrl + "/generatereport", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!generateReport.ok) {
				throw new Error("Failed to generate attendance report");
			}

			const data = await generateReport.json();
			const returnData = JSON.parse(data.body);
			const pdfLink = returnData.pdfUrl;

			if (pdfLink) {
				setIsGeneratingReport(false);
				setReportLink(pdfLink);
			} else {
				console.error("PDF link is missing in the response.");
			}
		} catch (error) {
			setIsGeneratingReport(false);
			console.error("Error generating pdf report:", error);
		} finally {
			setLoading(false);
		}
	};
	const handleSignOut = () => {
		logout();
		router.push("/");
	};
	const handleCancel = () => {
		setAttendance({});
		setSelectedDate(new Date());
		setIsDialogOpen(false);
	};
	const handleReportDialogCancel = () => {
		setIsReportDialogOpen(false);
	};

	return (
		<div className='min-h-screen bg-green-50'>
			<header className='bg-white shadow-sm'>
				<div className='max-w-md mx-auto px-4 py-3 flex justify-between items-center'>
					<h1 className='text-xl font-semibold text-green-800'>Prayer Times</h1>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='ghost' size='icon' className='rounded-full'>
								<User className='h-5 w-5 text-green-600' />
								<span className='sr-only'>Open user menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuLabel className='font-normal'>
								<div className='flex flex-col space-y-1'>
									<p className='text-sm font-medium leading-none'>{fullName}</p>
									<p className='text-xs leading-none text-muted-foreground'>
										{emailAddress}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleReport}>
								<FileText className='mr-2 h-4 w-4' />
								<span>Report</span>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleSignOut}>
								<LogOut className='mr-2 h-4 w-4' />
								<span>Sign out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			<div className='max-w-md mx-auto p-8 space-y-8'>
				<header className='text-center'>
					<h1 className='text-3xl font-bold text-green-800'>Hi, {fullName}</h1>
					<p className='text-green-600 mt-2'>
						Today&apos;s Date: {currentDate}
					</p>
				</header>

				<section className='bg-white rounded-lg p-6 shadow-sm'>
					<h2 className='text-xl font-semibold mb-4 text-green-700'>
						Prayer Times
					</h2>
					<ul className='space-y-2'>
						{prayerTimes.map((prayer) => (
							<li
								key={prayer.name}
								className='flex justify-between items-center py-2'
							>
								<span className='font-medium text-green-600'>
									{prayer.name}
								</span>
								<span className='text-green-500'>{prayer.time}</span>
							</li>
						))}
					</ul>
				</section>

				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button className='w-full bg-green-600 hover:bg-green-700 text-white'>
							<CalendarIcon className='mr-2 h-4 w-4' />
							Mark Attendance
						</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-[425px] bg-white'>
						<DialogHeader>
							<DialogTitle className='text-green-800'>
								Mark Voluntary Attendance
							</DialogTitle>
						</DialogHeader>
						<div className='space-y-4 py-4'>
							<div className='flex justify-center'>
								<Calendar
									mode='single'
									selected={selectedDate}
									onSelect={setSelectedDate}
									className='rounded-md border-none'
									classNames={{
										day_selected:
											"bg-green-600 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white",
										day_today: "bg-green-100 text-green-900",
									}}
								/>
							</div>
							<div className='space-y-2'>
								<Label className='text-base font-semibold text-green-700'>
									Select Prayers Attended:
								</Label>
								{prayerTimes.map((prayer) => (
									<div
										key={prayer.name}
										className='flex items-center space-x-2'
									>
										<Checkbox
											id={prayer.name}
											checked={attendance[prayer.name] || false}
											onCheckedChange={() =>
												handleAttendanceChange(prayer.name)
											}
											className='border-green-400 text-green-600 focus:ring-green-500'
										/>
										<Label
											htmlFor={prayer.name}
											className='text-sm font-medium leading-none text-green-700'
										>
											{prayer.name}
										</Label>
									</div>
								))}
							</div>
						</div>
						<DialogFooter>
							<Button
								variant='outline'
								onClick={handleCancel}
								className='border-green-500 text-green-700 hover:bg-green-50'
							>
								Cancel
							</Button>
							<Button
								onClick={handleSave}
								className='bg-green-600 text-white hover:bg-green-700'
							>
								Save
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
					<DialogContent className='sm:max-w-[425px] bg-white'>
						<DialogHeader>
							<DialogTitle className='text-green-800'>
								{isGeneratingReport
									? "Generating Report"
									: "Report Generated Successfully"}
							</DialogTitle>
						</DialogHeader>
						<div className='py-4'>
							{isGeneratingReport ? (
								<div className='flex flex-col items-center justify-center space-y-4'>
									<Loader2 className='h-8 w-8 animate-spin text-green-600' />
									<p className='text-green-600'>Generating your report...</p>
								</div>
							) : (
								<>
									<p className='text-green-600 mb-4'>
										Your report has been generated successfully. You can access
										it using the link below:
									</p>
									<div className='flex items-center space-x-2 bg-green-50 p-3 rounded-md'>
										<Link className='h-4 w-4 text-green-600' />
										<a
											href={reportLink}
											target='_blank'
											rel='noopener noreferrer'
											className='text-green-700 hover:underline break-all'
										>
											{reportLink}
										</a>
									</div>
								</>
							)}
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button
									className='bg-green-600 text-white hover:bg-green-700'
									disabled={isGeneratingReport}
								>
									{isGeneratingReport ? "Generating..." : "Close"}
								</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
