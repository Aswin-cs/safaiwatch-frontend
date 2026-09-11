import ProfilePage from "./[username]/page";

export default function MyProfilePage() {
  return <ProfilePage params={Promise.resolve({ username: "me" })} />;
}
