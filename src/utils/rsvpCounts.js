// Centralized RSVP counting logic to keep attendee math consistent across the app
// Contract:
// - Input: array of RSVP objects with a `status` field and optional `user` info
// - Output: normalized counts where confirmed = going + approved; maybe/not_going don't add to confirmed
// - Also returns pending and rejected for admin analytics

export function computeRsvpStats(rsvps = []) {
  const result = {
    confirmed: 0, // going + approved
    maybe: 0,
    notGoing: 0,
    pending: 0, // waiting_for_approval
    rejected: 0,
    attendees: [],
  }

  for (const r of rsvps) {
    const status = typeof r.status === 'string' ? r.status : String(r.status || '')
    switch (status) {
      case 'going':
      case 'approved':
        result.confirmed += 1
        break
      case 'maybe':
        result.maybe += 1
        break
      case 'not_going':
        result.notGoing += 1
        break
      case 'waiting_for_approval':
        result.pending += 1
        break
      case 'rejected':
        result.rejected += 1
        break
      default:
        break
    }

    // Normalize attendee view model
    result.attendees.push({
      id: r.user_id,
      name: r.user?.full_name || r.user?.email || 'Unknown User',
      email: r.user?.email || 'N/A',
      status,
      notes: r.notes,
    })
  }

  return result
}
