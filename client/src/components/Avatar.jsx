import { avatarColor, initials } from "../lib/avatarColor.js";

export default function Avatar({ user, large = false }) {
  const className = large ? "avatar lg" : "avatar";
  const background = avatarColor(user ? user.id : null);
  return (
    <div className={className} style={{ background }}>
      {user ? initials(user.name) : "--"}
    </div>
  );
}
