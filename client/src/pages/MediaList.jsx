import { LoadingButton } from "@mui/lab";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import tmdbConfigs from "../api/configs/tmdb.configs";
import mediaApi from "../api/modules/media.api";
import uiConfigs from "../configs/ui.configs";
import HeroSlide from "../components/common/HeroSlide";
import MediaGrid from "../components/common/MediaGrid";
import { setAppState } from "../redux/features/appStateSlice";
import { setGlobalLoading } from "../redux/features/globalLoadingSlice";
import { toast } from "react-toastify";
import usePrevious from "../hooks/usePrevious";
import favoriteApi from "../api/modules/favorite.api";
import reviewApi from "../api/modules/review.api";

const MediaList = () => {
    const { mediaType } = useParams();

    const [medias, setMedias] = useState([]);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [currCategory, setCurrCategory] = useState(0);
    const [currPage, setCurrPage] = useState(1);

    const prevMediaType = usePrevious(mediaType);
    const dispatch = useDispatch();

    // Updated categories to include "Favorites" and "Non-favorites"
    const mediaCategories = useMemo(() => ["popular", "top_rated", "Not review", "non_favorites"], []);
    const categoryLabels = ["popular", "top rated", "Not reviewed", "Not favorited"];

    useEffect(() => {
        dispatch(setAppState(mediaType));
        window.scrollTo(0, 0);
    }, [mediaType, dispatch]);

    useEffect(() => {
        const getMedias = async () => {
            if (currPage === 1) dispatch(setGlobalLoading(true));
            setMediaLoading(true);

            let response;
            let err;

            if (mediaCategories[currCategory] === "favorites") {
                const { response: favResponse, err: favErr } = await favoriteApi.getList();
                response = favResponse;
                console.log("Favorite Response:", favResponse);
                err = favErr;
            } else if (mediaCategories[currCategory] === "non_favorites") {
                // Get all medias and then filter out favorites
                const { response: allResponse, err: allErr } = await mediaApi.getList({
                    mediaType,
                    mediaCategory: "popular", // or any default category
                    page: currPage,

                });

                const { response: favResponse, err: favErr } = await favoriteApi.getList();

                console.log("All Media Response:", allResponse);
                console.log("Favorite Response:", favResponse);
                const favoritedIds = favResponse.map(item => item.mediaTitle);
                console.log("Favorite Ids:", favoritedIds);
                // response = allResponse.results.filter(mov => !favoritedIds.includes(mov.id));
                const filteredResults = allResponse.results.filter(item => !favoritedIds.includes(item.original_title));
                console.log("filteredResults:", filteredResults);
                response = {
                    ...allResponse, // Copy all properties from allResponse
                    results: filteredResults // Replace results with filtered results
                };

                console.log("Final Response:", response);
                err = allErr || favErr;
            } else if (mediaCategories[currCategory] === "Not review") {
                const { response: allResponse, err: allErr } = await mediaApi.getList({
                    mediaType,
                    mediaCategory: "popular", // or any default category
                    page: currPage,

                });

                const { response: favResponse, err: favErr } = await reviewApi.getList();

                console.log("All Media Response:", allResponse);
                console.log("Favorite Response:", favResponse);
                const favoritedIds = favResponse.map(item => item.mediaTitle);
                console.log("Favorite Ids:", favoritedIds);
                // response = allResponse.results.filter(mov => !favoritedIds.includes(mov.id));
                const filteredResults = allResponse.results.filter(item => !favoritedIds.includes(item.original_title));
                console.log("filteredResults:", filteredResults);
                response = {
                    ...allResponse, // Copy all properties from allResponse
                    results: filteredResults // Replace results with filtered results
                };

                console.log("Final Response:", response);
                err = allErr || favErr;

            }


            else {
                const { response: mediaResponse, err: mediaErr } = await mediaApi.getList({
                    mediaType,
                    mediaCategory: mediaCategories[currCategory],
                    page: currPage
                });
                console.log("mediaResponse:", mediaResponse);
                response = mediaResponse;
                console.log("Response:", response);
                err = mediaErr;
            }

            setMediaLoading(false);
            dispatch(setGlobalLoading(false));

            if (err) toast.error(err.message);
            if (response) {
                if (currPage !== 1) setMedias(m => [...m, ...response.results || response]);
                else setMedias([...response.results || response]);
            }
        };

        if (mediaType !== prevMediaType) {
            setCurrCategory(0);
            setCurrPage(1);
        }

        getMedias();
    }, [
        mediaType,
        currCategory,
        prevMediaType,
        currPage,
        mediaCategories,
        dispatch
    ]);

    const onCategoryChange = (categoryIndex) => {
        if (currCategory === categoryIndex) return;
        setMedias([]);
        setCurrPage(1);
        setCurrCategory(categoryIndex);
    };

    const onLoadMore = () => setCurrPage(currPage + 1);

    return (
        <>
            <HeroSlide mediaType={mediaType} mediaCategory={mediaCategories[currCategory]} />
            <Box sx={{ ...uiConfigs.style.mainContent }}>
                <Stack
                    spacing={2}
                    direction={{ xs: "column", md: "row" }}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ marginBottom: 4 }}
                >
                    <Typography fontWeight="700" variant="h5">
                        {mediaType === tmdbConfigs.mediaType.movie ? "Movies" : "TV Series"}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        {categoryLabels.map((cate, index) => (
                            <Button
                                key={index}
                                size="large"
                                variant={currCategory === index ? "contained" : "text"}
                                sx={{
                                    color: currCategory === index ? "primary.contrastText" : "text.primary"
                                }}
                                onClick={() => onCategoryChange(index)}
                            >
                                {cate}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
                <MediaGrid
                    medias={medias}
                    mediaType={mediaType}
                />
                <LoadingButton
                    sx={{ marginTop: 8 }}
                    fullWidth
                    color="primary"
                    loading={mediaLoading}
                    onClick={onLoadMore}
                >
                    load more
                </LoadingButton>
            </Box>
        </>
    );
};

export default MediaList;
