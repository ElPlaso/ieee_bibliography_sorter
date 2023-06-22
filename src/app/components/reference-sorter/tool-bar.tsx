"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Switch from "../switch";
import { BiImport } from "react-icons/bi";
import { MdContentCopy, MdDeleteOutline, MdSave } from "react-icons/md";
import { Tooltip } from "react-tooltip";
import classnames from "classnames";
import { useSelector, useDispatch } from "react-redux";
import {
  selectItems,
  selectPrepend,
  selectCopyWithLinks,
  setItems,
  togglePrepend,
  toggleCopyWithLinks,
} from "../../features/references/reference-slice";
import { renderWithLinksHrefOnly } from "../utils";
import {
  createProjectAction,
  updateProjectItemsAction,
  getTitle,
  updateProjectTitleAction,
  getItems,
} from "../../features/projects/project-slice";
import { AppDispatch, RootState } from "../../store/store";
import { SortableItem } from "@/app/types/sortable-item";
import { unwrapResult } from "@reduxjs/toolkit";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ToolBarActionButton from "../tool-bar/tool-bar-action-button";
import classNames from "classnames";
import { selectTheme } from "@/app/features/theme/theme-slice";

interface ToolBarProps {
  setModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalIsOpen: boolean;
}

// transforms an array of items into an array of strings
function transformItemsToStrings(items: SortableItem[]) {
  return items.map((item) => item.content);
}

// used for checking if items have been modified
function itemsEqual(items1: string[], items2: string[]) {
  if (items1 === items2) return true;
  if (items1 == null || items2 == null) return false;
  if (items1.length !== items2.length) return false;
  for (var i = 0; i < items1.length; ++i) {
    if (items1[i] !== items2[i]) return false;
  }
  return true;
}

export default function ToolBar({ setModalIsOpen, modalIsOpen }: ToolBarProps) {
  const items = useSelector(selectItems);
  const prepend = useSelector(selectPrepend);
  const copyWithLinks = useSelector(selectCopyWithLinks);
  const dispatch = useDispatch<AppDispatch>();
  const [projectTitle, setProjectTitle] = useState("");
  const user = useSelector((state: RootState) => state.auth.user);
  const projectId = useSelector(
    (state: RootState) => state.references.projectId
  );
  const [editingTitle, setEditingTitle] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const loading = useSelector((state: RootState) => state.projects.loading);
  const [initialItems, setInitialItems] = useState<string[]>([]);

  useEffect(() => {
    if (!projectId) return;
    // get title of project with given id
    dispatch(getTitle(projectId)).then((result) => {
      const title = unwrapResult(result);
      setProjectTitle(title);
    });
    // get items of project with given id
    dispatch(getItems(projectId)).then((result) => {
      const items = unwrapResult(result);
      setInitialItems(items);
    });
  }, [projectId, dispatch]);

  const [isScrolled, setIsScrolled] = useState(false);

  const theme = useSelector(selectTheme);

  const handleSaveProject = async (toSaveId: string | undefined) => {
    if (!user) {
      toast("Please sign in to create a project");
      return;
    }
    if (toSaveId) {
      // update existing project
      const itemsAsStrings = transformItemsToStrings(items);
      var title = await dispatch(getTitle(toSaveId)).then((result) => {
        const title = unwrapResult(result);
        return title;
      });

      const itemsChanged: boolean = !itemsEqual(itemsAsStrings, initialItems);

      const makeChanges = async () => {
        if (itemsChanged) {
          await dispatch(
            updateProjectItemsAction({
              projectId: toSaveId,
              items: itemsAsStrings,
            })
          );
        }
        if (title !== projectTitle) {
          await dispatch(
            updateProjectTitleAction({
              title: projectTitle,
              projectId: toSaveId,
            })
          );
        }
      };
      // update if changes mave been made
      if (itemsChanged || title !== projectTitle) {
        makeChanges().then((respose) => toast.success("Project saved"));
      }
    } else {
      // create new project
      dispatch(
        createProjectAction({
          title: projectTitle,
          items: items.map((item) => item.content),
          uid: user.uid,
        })
      )
        .then((response) => {
          const projectId = unwrapResult(response).projectId;
          router.push(`/project?id=${projectId}`);
        })
        .then(() => toast.success("Project created"))
        .catch(() => {
          toast.error("Failed to create project");
        });
    }
  };

  // close the title input field when clicked outside
  useEffect(() => {
    function handleClickOutside(event: { target: any }) {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setEditingTitle(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // focus the input field when title is clicked
  useEffect(() => {
    if (editingTitle) {
      inputRef.current?.focus();
    }
  }, [editingTitle]);

  useEffect(() => {
    const checkScroll = () => {
      if (window.pageYOffset > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", checkScroll);
    return () => {
      window.removeEventListener("scroll", checkScroll);
    };
  }, []);

  function handlePrependChange() {
    dispatch(togglePrepend());
  }

  function handleCopyWithLinksChange() {
    dispatch(toggleCopyWithLinks());
  }

  function handleCopyToClipboard() {
    const formattedItems = items
      .map(
        (item, index) =>
          `[${index + 1}] ${
            copyWithLinks ? renderWithLinksHrefOnly(item.content) : item.content
          }`
      )
      .join("\n\n");

    if (copyWithLinks) {
      const formattedItemsHTML = formattedItems.replace(/\n/g, "<br />");
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/html": new Blob([formattedItemsHTML], { type: "text/html" }),
            "text/plain": new Blob([formattedItems], { type: "text/plain" }),
          }),
        ])
        .then(() => {
          toast.success("Copied to clipboard with links");
        })
        .catch((error) => {
          toast.error("Could not copy text");
        });
    } else {
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/plain": new Blob([formattedItems], { type: "text/plain" }),
          }),
        ])
        .then(() => {
          toast.success("Copied to clipboard");
        })
        .catch((error) => {
          toast.error("Could not copy text");
        });
    }
  }

  function handleClearItems() {
    dispatch(setItems([]));
  }

  return (
    <div
      className={classnames(
        "flex items-center justify-between w-full sticky top-0 dark:text-white transition-all duration-100 space-x-2",
        {
          "shadow-lg rounded-full bg-white dark:bg-darkColor top-[100px] py-5 px-7 dark:shadow-xl z-20":
            isScrolled && !modalIsOpen,
        }
      )}
    >
      <div className="flex space-x-2 items-center h-full w-[25%]">
        <a data-tooltip-id="save" data-tooltip-content="Save project">
          <button
            onClick={() => {
              handleSaveProject(projectId);
            }}
            className="hover:text-white text-green-500 hover:bg-green-500 p-2 hover:shadow-md rounded"
          >
            <MdSave size={24} />
          </button>
          <Tooltip id="save" place="bottom" />
        </a>
        {loading ? (
          <Skeleton
            containerClassName="flex-1"
            height={35}
            baseColor={theme == "dark" ? "#181818" : ""}
            highlightColor={theme == "dark" ? "#282828" : ""}
          />
        ) : editingTitle ? (
          <input
            type="text"
            ref={inputRef}
            className="bg-white dark:bg-darkColor rounded p-2 w-full border border-gray-300 dark:border-none outline-none color-transition-applied"
            value={projectTitle}
            placeholder="New project"
            onChange={(e) => setProjectTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditingTitle(false);
              }
            }}
          />
        ) : (
          <button
            className={classNames("dark:text-white cursor-text", {
              "text-gray-400 dark:text-opacity-20": projectTitle.trim() === "",
            })}
            onClick={() => setEditingTitle(true)}
          >
            {projectTitle.trim() === "" ? "New project" : projectTitle}
          </button>
        )}
      </div>
      <div className="flex space-x-6 items-center">
        <div className="flex space-x-3">
          <Switch
            label={"Prepend"}
            checked={prepend}
            id="prepend"
            onChange={handlePrependChange}
          />

          <Switch
            label={"Copy links"}
            checked={copyWithLinks}
            id="copyWithLinks"
            onChange={handleCopyWithLinksChange}
          />
        </div>
        <div className="flex space-x-2">
          <ToolBarActionButton
            onClick={() => setModalIsOpen(true)}
            id="import"
            icon={<BiImport size={24} />}
            place={"bottom"}
            tip={"Import references"}
            disabled={loading}
          />
          <ToolBarActionButton
            onClick={handleCopyToClipboard}
            id="copy"
            icon={<MdContentCopy size={24} />}
            place={"bottom"}
            tip={"Copy to clipboard"}
            disabled={items.length === 0 || loading}
          />
          <ToolBarActionButton
            onClick={handleClearItems}
            id="delete"
            icon={<MdDeleteOutline size={24} />}
            place={"bottom"}
            tip={"Delete all references"}
            disabled={items.length === 0 || loading}
          />
        </div>
      </div>
    </div>
  );
}
