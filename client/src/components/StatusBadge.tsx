// function StatusBadge({ booking }: { booking: Booking }) {
//   const status = getDisplayStatus(booking);

//   if (status === "confirmed") {
//     return (
//       <Badge
//         className="
//           gap-1.5
//           border border-emerald-500/20
//           bg-emerald-500/10
//           text-emerald-600
//           hover:bg-emerald-500/10
//           dark:text-emerald-400
//         "
//       >
//         <CheckCircle2 className="h-3.5 w-3.5" />
//         Confirmed
//       </Badge>
//     );
//   }

//   if (status === "completed") {
//     return (
//       <Badge
//         variant="secondary"
//         className="
//           gap-1.5
//           border 
//           border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
//         "
//       >
//         <CheckCircle2 className="h-3.5 w-3.5" />
//         Completed
//       </Badge>
//     );
//   }

//   if (status === "cancelled") {
//     return (
//       <Badge
//         className="
//           gap-1.5
//           border border-destructive/20
//           bg-destructive/10
//           text-destructive
//           hover:bg-destructive/10
//         "
//       >
//         <XCircle className="h-3.5 w-3.5" />
//         Cancelled
//       </Badge>
//     );
//   }

//   return (
//     <Badge
//       className="
//         gap-1.5
//         border border-amber-500/20
//         bg-amber-500/10
//         text-amber-600
//         hover:bg-amber-500/10
//         dark:text-amber-400
//       "
//     >
//       <Clock3 className="h-3.5 w-3.5" />
//       Pending
//     </Badge>
//   );
// }