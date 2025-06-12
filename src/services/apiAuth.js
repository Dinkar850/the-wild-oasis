import supabase, { supabaseUrl } from "./supabase";

export async function signup({ fullName, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        fullName,
        avatar: "",
      },
    },
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// we need to fetch the user again and again whenever something happens or the user opens the app, to check if he is still authenticated so that the user does not have to login multiple times

export async function getCurrentUser() {
  const { data: session } = await supabase.auth.getSession(); //gets  form local storage
  if (!session.session) return null;

  //if session hasnt expired do below, if it was expired we had returned a null already

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data?.user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function updateCurrentUser({ password, fullName, avatar }) {
  //1. update password or fullName, not both at the same time
  let updateData;
  if (password) updateData = { password };
  if (fullName) updateData = { data: { fullName } };
  const { data, error } = await supabase.auth.updateUser(updateData);

  if (error) throw new Error(error.message);
  if (!avatar) return data;

  //2. upload avatar image
  const filename = `avatar-${data.user.id}-${Math.random()}`;

  const { erorr: storageError } = await supabase.storage
    .from("avatars")
    .upload(filename, avatar);
  if (storageError) throw new Error(storageError.message);

  //3. update avatar in the currently logged in user
  const { data: updatedUser, error: error2 } = await supabase.auth.updateUser({
    data: {
      avatar: `${supabaseUrl}/storage/v1/object/public/avatars/${filename}`,
    },
  });
  if (error2) throw new Error(error2.message);
  return updatedUser;
}
