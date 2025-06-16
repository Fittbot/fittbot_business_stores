import axios from 'axios';
import axiosInstance from './axiosInstance';
import apiConfig from './apiConfig';
import { showToast } from '../utils/Toaster';
const baseURL = apiConfig.API_URL;

export const loginAPI = async (payload) => {
  try {
    const res = await axios.post(`${baseURL}/auth/login`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const registerAPI = async (payload) => {
  try {
    const res = await axios.post(
      `${baseURL}/auth/new_gym_owner_registration`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const changePasswordAPI = async (payload) => {
  try {
    const res = await axios.post(`${baseURL}/auth/change-password`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const forgotpasswordAPI = async (data, type) => {
  try {
    const res = await axios.post(`${baseURL}/auth/send-otp`, { data, type });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const VerifyOTPAPI = async (data, otp) => {
  try {
    const res = await axios.post(`${baseURL}/auth/verify-otp`, { data, otp });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addWorkoutTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/gym_workout_template/addworkouttemplate`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getWorkoutTemplateAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(
      `/gym_workout_template/addworkouttemplate`,
      {
        params: {
          gym_id: gym_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFittbotWorkoutAPI = async () => {
  try {
    const res = await axiosInstance.get(
      `/gym_workout_template/get_fittbot_workout`
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editWorkoutTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/owner/gym/addworkouttemplate`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteWorkoutTemplateAPI = async (id, gym_id) => {
  try {
    const res = await axiosInstance.delete(
      `/gym_workout_template/addworkouttemplate`,
      {
        params: {
          id: id,
          gym_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editAllWorkoutTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/gym_workout_template/editworkouttemplate`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFeedPostAPI = async (gym_id, client_id, role) => {
  try {
    const res = await axiosInstance.get(`/owner/get_post`, {
      params: {
        gym_id: gym_id,
        client_id: client_id,
        role: role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const createFeedPostAPI = async (payload) => {
  try {
    const response = await axiosInstance.post(`/owner/create_post`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return {
      status: response.status || 500,
      data: response.data || null,
      message: response.data?.message || 'Post created successfully',
    };
  } catch (error) {
    showToast({
      type: 'error',
      title: 'API Error',
      desc: error.message,
    });
  }
};

export const likeFeedPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/post_likes`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const createCommentPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/create_comment`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getCommentPostAPI = async (gym_id, post_id, client_id, role) => {
  try {
    const res = await axiosInstance.get(`/owner/fetch_comment`, {
      params: {
        gym_id,
        post_id,
        client_id,
        role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getProfileDataAPI = async (gym_id, owner_id, client_id, role) => {
  try {
    const res = await axiosInstance.get(`/owner/profile_data`, {
      params: {
        gym_id,
        client_id,
        owner_id,
        role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/edit_post`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deletePostAPI = async (gym_id, post_id) => {
  try {
    const res = await axiosInstance.delete(`/owner/delete_post`, {
      params: {
        gym_id,
        post_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteCommentAPI = async (comment_id) => {
  try {
    const res = await axiosInstance.delete(`/owner/delete_comment`, {
      params: {
        comment_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getLikesDataAPI = async (gym_id, post_id) => {
  try {
    const res = await axiosInstance.get(`/owner/liked_by_names`, {
      params: {
        gym_id,
        post_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientDataAPI = async (gym_id, client_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/client_data`, {
      params: {
        gym_id,
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymHomeDataAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/home/all`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getmembersDataAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/members/all`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getCollectionSummaryAPI = async (gym_id, scope) => {
  try {
    const res = await axiosInstance.get(`/ledger/collection_summary`, {
      params: {
        gym_id,
        scope,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getExpenditureListAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/ledger/view_expenditure`, {
      params: {
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addExpendituresAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/ledger/add_expenditure`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/client`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getPlansandBatchesAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/plans_and_batches`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFeeDetailsAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/get_fee_details`, {
      params: {
        training_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateFeeStatusAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner/gym/update_fee_status`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteFeeStatusAPI = async (id, gymId) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/delete_fee_status`, {
      params: {
        client_id: id,
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getAnalysisAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/hourly_agg`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/add_client_data`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addTrainerAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/add_trainer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getTrainersAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/get_trainers`, {
      params: {
        gym_id: gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateTrainerAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/edit_trainer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteTrainerAPI = async (id, gym_id) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/delete_trainer`, {
      params: {
        trainer_id: id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addPlanAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/add_plan`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editPlanAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/edit_plan`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deletePlanAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/delete_plan`, {
      params: {
        id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addBatchAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/add_batch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editBatchAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/edit_batch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteBatchAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/delete_batch`, {
      params: {
        batch_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addDietTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/adddiettemplate`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getDietTemplateAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(
      `/gym_diet_template/get_diet_template`,
      {
        params: {
          gym_id: gym_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteDietTemplateAPI = async (id, gym_id) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/deletediettemplate`, {
      params: {
        id: id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editAllDietTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/editdiettemplate`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getAsssignmentsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym_assigned_data`, {
      params: {
        gym_id: gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateProfileAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/update_profile`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const assignTrainerAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/assign_trainer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFeedbacksAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/feedback`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getConversationsAPI = async (gym_id, user_id) => {
  try {
    const res = await axiosInstance.get(`/owner/conversations`, {
      params: {
        gym_id,
        user_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getMessagesAPI = async (gym_id, user_id, owner_id) => {
  try {
    const res = await axiosInstance.get(`/owner/owner_messages`, {
      params: {
        gym_id,
        user_id,
        owner_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const sendMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/send_message_owners`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getUnverifiedClientsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/pending_clients`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateUnverifiedClientsAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/owner/gym/edit_pending_clients`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteUnverifiedClientsAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/delete_pending_client`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateVerificationStatusAPI = async (payload) => {
  try {
    const res = await axios.post(
      `${baseURL}/auth/update_verification_status`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const sendEmailVerificationOTPAPI = async (payload) => {
  try {
    const res = await axios.post(
      `${baseURL}/auth/send_verification_otp`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const resendOTPAPI = async (data, type, role, id) => {
  try {
    const res = await axios.post(`${baseURL}/auth/resend-otp`, {
      data,
      type,
      role,
      id,
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getRewardsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/get_rewards`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const createRewardAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/create_rewards`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateRewardAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/update_rewards`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteRewardAPI = async (reward_id) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/delete_rewards`, {
      params: {
        reward_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getPrizeListAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/get_prize_list`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymLocationAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/get_location`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateGymLocationAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/add_location`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const changeGymLocationAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/edit_location`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const reportPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/report_user`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const blockPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/block_user`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const FetchBlockedUsersAPI = async (client_id, role) => {
  try {
    const res = await axiosInstance.get(`/owner/get_blocked_users`, {
      params: {
        client_id,
        role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const UnblockUserAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/unblock_users`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const checkPlanAssignmentsAPI = async (planId) => {
  try {
    const res = await axiosInstance.get(`/owner/check-plan-assignments`, {
      params: {
        plan_id: planId,
      },
    });
    return res?.data;
  } catch (error) {
    return error?.response.data;
  }
};

export const checkBatchAssignmentsAPI = async (batchId) => {
  try {
    const res = await axiosInstance.get(`/owner/check-batch-assignments`, {
      params: {
        batch_id: batchId,
      },
    });
    return res?.data;
  } catch (error) {
    return error?.response.data;
  }
};

export const getUsersWithPlansAndBatchesAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/clients-with-plans`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateUserPlanAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/update-client-plan`, payload);
    return res?.data;
  } catch (err) {
    return err.response?.data;
  }
};

export const updateUserBatchAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/update-client-batch`, payload);
    return res?.data;
  } catch (err) {
    return err.response?.data;
  }
};

export const updateGivenPrizeAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/update-given-prize`, payload);
    return res?.data;
  } catch (err) {
    return err.response?.data;
  }
};

export const AddExpenditureAPI = async (payload) => {
  try {
    // const res = await axiosInstance.post(`/owner/add-expenditure`, payload);
    const res = await axiosInstance.post(`/ledger/add_expenditure`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const UpdateExpenditureAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/ledger/update_expenditure`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const DeleteExpenditureAPI = async (gym_id, expense_id) => {
  try {
    const res = await axiosInstance.delete(`/ledger/delete_expenditure`, {
      params: {
        gym_id,
        expense_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const UpdateInvoiceDiscount = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/update-invoice`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// ----------------- handle to client enquiries -----------------

export const AddClientEnquiry = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym-enquiries`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientEnquiry = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym-enquiries`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const updateClientEnquiryStatus = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/owner/update-enquiry-status`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// ----------------- to maintain the Gym Plans or Brochure -----------------

export const PostGymPlansImages = async (formData) => {
  try {
    const res = await axiosInstance.post(
      `/owner/update-gym-brochures`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res?.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    return {
      status: 500,
      message: 'Something went wrong. Please try again.',
    };
  }
};

export const getGymPlansImages = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/get-gym-brochures`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// ----------------- to send the and receive the estimate and receipts -----------------

export const SendEstimatesToExpireMembers = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/send-estimates`, payload);
    return res?.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    return {
      status: 500,
      message: 'Something went wrong. Please try again.',
    };
  }
};

export const SendReceiptsToPaidMembers = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/send-receipts`, payload);
    return res?.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    return {
      status: 500,
      message: 'Something went wrong. Please try again.',
    };
  }
};

export const GetReceiptForPaidMembers = async (gym_id, month, year) => {
  try {
    const res = await axiosInstance.get(`/owner/fees-receipts`, {
      params: {
        gym_id,
        month,
        year,
      },
    });
    return res?.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    return {
      status: 500,
      message: 'Something went wrong. Please try again.',
    };
  }
};

// ---------------------------- import and export user api --------------------------------

export const fetchImportDataAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/get-export-data`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const ImportDataAPI = async (formData) => {
  try {
    const res = await axiosInstance.post(`/owner/import_gym_data`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res?.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    return {
      status: 500,
      message: 'Something went wrong. Please try again.',
    };
  }
};

export const sendIntimationsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/send-intimations`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientFromQRAPI = async (uuid) => {
  try {
    const res = await axiosInstance.get(`/owner/get-client-data-qr`, {
      params: {
        uuid,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// /owner/gym/getsinglediettemplate

// params:{

// gym_id,
// template_id
// }

export const getSingleDietTemplate = async (gym_id, template_id) => {
  try {
    const res = await axiosInstance.get(
      `/gym_diet_template/get_single_diettemplate`,
      {
        params: {
          gym_id,
          template_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editDietTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/gym_diet_template/update_diet_template`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getNewbiesListAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/newbies`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const supportAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/support_token_owner/generate`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getGymAnnouncementsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_announcements/announcements`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteAnnouncementAPI = async (announcement_id) => {
  try {
    const res = await axiosInstance.delete(`/gym_announcements/announcements`, {
      params: {
        announcement_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addAnnouncementAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/gym_announcements/announcements`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateAnnouncementAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/gym_announcements/announcements`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymOffersAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_announcements/offers`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const OTPVerificationAPI = async (data, otp, role) => {
  try {
    const res = await axios.post(`${baseURL}/auth/otp-verification`, {
      data,
      otp,
      role,
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymRewardsQuestAPI = async () => {
  try {
    const res = await axiosInstance.get(`/owner/rewards/quest`);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// feed -> Gym Announcements

export const getGymAnnouncementsAPI2 = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_feed/get_announcements`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const postGymAnnouncementsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_feed/add_announcement`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateGymAnnouncementsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/gym_feed/update_announcement`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteGymAnnouncementsAPI = async (payload) => {
  try {
    const { gym_id, announcement_id } = payload;
    const res = await axiosInstance.delete(`/gym_feed/delete_announcement`, {
      params: {
        gym_id,
        announcement_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// feed -> Gym Offers

export const getGymOffersAPI2 = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_feed/get_offer`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const postGymOffersAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_feed/add_offer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateGymOffersAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_feed/update_offer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteGymOffersAPI = async (payload) => {
  try {
    const { gym_id, offer_id } = payload;
    const res = await axiosInstance.delete(`/gym_feed/delete_offer`, {
      params: {
        gym_id,
        offer_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//--------------------- Expo token api ---------------------

export const updateExpoTokenAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner_expo/update_expo_token`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
