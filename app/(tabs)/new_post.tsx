import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { View, TextInput, Button, Image, Alert, ScrollView } from "react-native";
import { createPost } from "../../services/posts";

export default function NewPost() {
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true, // en iOS 14+, Android limitado
    });
    if (!res.canceled) {
      const uris = ("assets" in res ? res.assets : []).map(a => a.uri).filter(Boolean) as string[];
      setImages(prev => [...prev, ...uris]);
    }
  };

  const submit = async () => {
    if (!body.trim()) return Alert.alert("Post", "Escribe algo.");
    setBusy(true);
    try {
      await createPost(body.trim(), images);
      setBody("");
      setImages([]);
      Alert.alert("Post", "Publicado 👍");
    } catch (e) {
      console.log(e);
      Alert.alert("Post", "No se pudo publicar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <TextInput
        placeholder="¿Qué está pasando?"
        value={body}
        onChangeText={setBody}
        multiline
        style={{ borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 120 }}
      />
      <Button title="Seleccionar imagen" onPress={pickImage} />
      {images.map((uri, i) => (
        <Image key={i} source={{ uri }} style={{ width: "100%", height: 200, borderRadius: 12 }} />
      ))}
      <Button title={busy ? "Publicando..." : "Publicar"} onPress={submit} disabled={busy} />
    </ScrollView>
  );
}
