import CheckoutClient from "@/components/CheckoutClient";
import { getErrorMessage } from "@/lib/getErrorMessage";
import serverApi from "@/lib/serverApi";
import { ShowSeatResponse } from "@/types";

type CheckoutPageProps = {
  params: Promise<{
    showId: string;
  }>;
};

const fetchShowSeats = async (
  showId: string,
): Promise<ShowSeatResponse | null> => {
  try {
    const response = await serverApi.get<ShowSeatResponse>(
      `/shows/${showId}/seats`,
    );

    return response.data;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.log(errMsg);
    return null;
  }
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { showId } = await params;
  const showSeats = await fetchShowSeats(showId);

  return <CheckoutClient data={showSeats} />;
}
