import { defineToolcraft } from "@/toolcraft/runtime";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
  },
  panels: {
    controls: {
      title: "Omen",
      sections: [
        {
          title: "Name",
          controls: {
            nameInput: {
              type: "text",
              target: "nameInput",
              label: "Name",
              defaultValue: "Alex",
            },
            randomName: {
              type: "actions",
              target: "randomName",
              label: false,
              actions: [{ label: "Random", value: "randomName", variant: "outline" }],
            },
          },
        },
        {
          title: "Visuals",
          controls: {
            particleCount: {
              type: "slider",
              target: "particleCount",
              label: "Particles",
              defaultValue: 20,
              min: 5,
              max: 60,
              step: 1,
            },
            auraSpeed: {
              type: "slider",
              target: "auraSpeed",
              label: "Aura Speed",
              defaultValue: 0.5,
              min: 0.1,
              max: 2.0,
              step: 0.1,
            },
          },
        },
      ],
    },
  },
  toolbar: {
    history: false,
    radar: false,
    zoom: false,
  },
});
