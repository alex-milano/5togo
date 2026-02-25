import {
  doc,
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

/**
 * Share a task with multiple users.
 * Updates task with sharedWith (handles) and sharedWithUids (UIDs for queries).
 * Creates one notification per recipient.
 *
 * @param {string} taskId - ID of task to share
 * @param {Array} recipients - [{handle, userId}, ...] array of users
 * @param {Object} task - Full task object from local state
 * @param {string} sharerHandle - Handle of current user (owner)
 */
export async function shareTask(taskId, recipients, task, sharerHandle) {
  if (!recipients.length) return

  const handles = recipients.map(r => r.handle)
  const uids = recipients.map(r => r.userId)

  // 1. Update task document with handles and UIDs
  await updateDoc(doc(db, 'tasks', taskId), {
    sharedWith: arrayUnion(...handles),
    sharedWithUids: arrayUnion(...uids),
    isShared: true,
    sharedBy: sharerHandle,
    sharedAt: serverTimestamp(),
  })

  // 2. Create notifications for each recipient
  const notifDocs = recipients.map(recipient =>
    addDoc(collection(db, 'sharedTaskNotifications'), {
      userId: recipient.userId,
      taskId,
      sharedBy: sharerHandle,
      sharedByHandle: sharerHandle,
      taskText: task.text,
      read: false,
      createdAt: serverTimestamp(),
    })
  )
  await Promise.all(notifDocs)
}

/**
 * Remove a user from task's sharedWith lists.
 * Does NOT delete notifications (they persist for record-keeping).
 */
export async function unshareTask(taskId, handle, uid) {
  await updateDoc(doc(db, 'tasks', taskId), {
    sharedWith: arrayRemove(handle),
    sharedWithUids: arrayRemove(uid),
  })
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notifId) {
  await updateDoc(doc(db, 'sharedTaskNotifications', notifId), { read: true })
}

/**
 * Mark all unread notifications as read (batch update).
 */
export async function markAllNotificationsRead(notifs) {
  const unread = notifs.filter(n => !n.read)
  if (!unread.length) return
  await Promise.all(
    unread.map(n => updateDoc(doc(db, 'sharedTaskNotifications', n.id), { read: true }))
  )
}
