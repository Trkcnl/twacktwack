import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Ruler,
  Save,
  Trash2,
  AlertTriangle,
  FileText,
} from "lucide-react";

// --- IMPORTS ---
import { useAuth } from "@/context/AuthHook";
import api from "../services/api";

// --- SHADCN IMPORTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ------------------------------------------------------------------
// 1. DEFINE SCHEMA
// ------------------------------------------------------------------

// We flatten the structure here for easier form handling
const profileSchema = z.object({
  id: z.coerce.number<number>(),
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  height: z.coerce.number<number>().min(0, "Height must be positive"),
  // We expect a string YYYY-MM-DD from the input
  birthdate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid Date"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ------------------------------------------------------------------
// 2. COMPONENT
// ------------------------------------------------------------------

export const UserProfilePage = () => {
  const { user, logout } = useAuth(); // We might need login/fetchUser to refresh state
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Setup Form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      id: 0,
      username: "",
      email: "",
      name: "",
      bio: "",
      height: 0,
      birthdate: new Date().toISOString().split("T")[0],
    },
    mode: "onChange",
  });

  // 2. Sync User Data to Form
  // When the 'user' context loads, populate the form fields
  useEffect(() => {
    if (user) {
      // Handle Date parsing safely
      let formattedDate = "";
      try {
        const dateObj = new Date(user.user_profile.birthdate);
        formattedDate = format(dateObj, "yyyy-MM-dd");
      } catch (e) {
        console.error("Date parse error", e);
      }

      form.reset({
        id: user.user_profile.id,
        username: user.username,
        email: user.email,
        name: user.user_profile?.name,
        bio: user.user_profile?.bio || "",
        height: user.user_profile?.height,
        birthdate: formattedDate,
      });
    }
  }, [user, form]);

  // 3. Handle Update
  const onSubmit = async (data: ProfileFormValues) => {
    console.log(user);
    if (!user) return;

    // Reconstruct the nested payload required by the Backend
    const payload = {
      id: data.id,
      name: data.name,
      bio: data.bio,
      height: data.height,
      birthdate: data.birthdate,
    };

    try {
      await api.put(`/api/v1/userprofiles/${data.id}/`, payload);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  // 4. Handle Delete
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete("/api/v1/auth/users/me/");

      logout();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and public profile information.
        </p>
      </div>

      {/* MAIN FORM */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* SECTION 1: ACCOUNT INFO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" /> Account Information
              </CardTitle>
              <CardDescription>
                Your login credentials and identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="relative pb-6">
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage variant={"floating"} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="relative pb-6">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage variant={"floating"} />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* SECTION 2: PERSONAL DETAILS (User Profile) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Personal Details
              </CardTitle>
              <CardDescription>
                Information about your physical stats and bio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="relative pb-6">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage variant={"floating"} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem className="relative pb-6">
                      <FormLabel>Birthdate</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          {/* We use type="date" native picker */}
                          <Input type="date" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage variant={"floating"} />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage variant={"floating"} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem className="relative pb-6">
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little about your fitness goals..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage variant={"floating"} />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-4">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="ml-auto"
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                <Save className="ml-2 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* DANGER ZONE */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions related to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Permanently remove your account and all data.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteAccount()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Yes, delete my account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};
