"use client";

import { unwrapResult } from "@reduxjs/toolkit";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  checkProjectExists,
  getItems,
} from "../features/projects/project-slice";
import { useSearchParams } from "next/navigation";
import ReferenceSorter from "../components/reference-sorter";
import { AppDispatch, RootState } from "../store/store";
import { setProject, setItems } from "../features/references/reference-slice";
import { SortableItem } from "../types/sortable-item";

// transforms an array of strings into an array of sortable items
function transformItems(items: string[]): SortableItem[] {
  return items.map((item) => {
    return {
      id: Date.now().toString(),
      content: item,
    };
  });
}

export default function ProjectPage() {
  const [projectExists, setProjectExists] = useState(true);
  const projectId = useSearchParams().get("id");
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (projectId && user) {
      dispatch(checkProjectExists({ projectId: projectId, uid: user.uid }))
        .then((result) => {
          const projectExists = unwrapResult(result);
          setProjectExists(projectExists);
          if (!projectExists) {
            toast.error("Project does not exist");
            router.push("/");
          } else {
            dispatch(setProject(projectId));
            dispatch(getItems(projectId)).then((result) => {
              const items = unwrapResult(result);
              dispatch(setItems(transformItems(items)));
            });
          }
        })
        .catch((error) => {
          console.log(error);
          toast.error("An error occurred while checking if the project exists");
        });
    }
  }, [projectId, dispatch, router]);

  if (!projectExists) {
    return null;
  }

  return <ReferenceSorter />;
}
