/**
 * @file This file contains the enumerations related to the 'Bundle' feature.
 */

/**
 * An enumeration of possible statuses for a bundle.
 * This helps ensure that we only use valid status values throughout the app.
 */
export enum EBundleStatus {
  Pending = 'pending',
  Approved = 'approved',
  Denied = 'denied'
}