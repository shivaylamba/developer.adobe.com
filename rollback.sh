#!/bin/bash
set -e # error out on first failure
BRANCH=$(git symbolic-ref -q HEAD);
if [ "$BRANCH" = "refs/heads/master" ]; then
    git pull --tags origin master
    TARGET="";
    if [ $# -eq 0 ]; then
        # If no argument is supplied, sort the known-good tags by date, and grab
        # the second-to-last one (presumably not the `published` tag)
        TARGET=$(git tag --sort=committerdate | grep "known-good" | tail -2 | head -1);
    else
        # If user supplied an argument to the script, use that as target
        if git rev-parse $1 >/dev/null 2>&1
        then
            TARGET=$1;
        else
            echo "$1 is not a valid git reference! Aborting.";
            exit 1;
        fi;
    fi;
    echo "Will rollback to: ${TARGET}";
    echo "This will blast away any uncommitted/untracked work in your tree.";
    echo "Proceed? (enter a number)";
    select yn in "Yes" "No"; do
        if [ "$yn" = "Yes" ]; then
            # Reset the index and working tree to the desired tree
            git reset --hard $TARGET;
            # Move the branch pointer back to the previous HEAD
            git reset --soft HEAD@{1};
            git commit -m "🚑 Rolling back to previous commit ${TARGET}!";
            git push origin master;
            exit 0;
        else
            echo "Aborting!";
            exit 1;
        fi;
    done;
else
    echo "Need to be on master branch! Aborting.";
    exit 1;
fi
