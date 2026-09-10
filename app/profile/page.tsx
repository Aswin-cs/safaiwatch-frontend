import ProfilePage from "./[id]/page";

export default function MyProfilePage() {
  return <ProfilePage params={Promise.resolve({ id: "me" })} />;
}
