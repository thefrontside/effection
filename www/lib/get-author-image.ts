import { authorsWithImage } from "./author-config.ts";

/**
 * Get the avatar image URL for an author.
 * Extracts the first name, lowercases it, and checks if an avatar exists.
 * Falls back to the Effection logo if no avatar is found.
 */
export function getAuthorImage(author: string): string {
  let firstName = author.split(" ")[0].toLowerCase();
  return authorsWithImage.includes(firstName)
    ? `/assets/images/authors/${firstName}.webp`
    : "/assets/images/icon-effection.svg";
}
